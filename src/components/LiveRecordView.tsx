import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  Pause,
  Play,
  Square,
  Save,
  Languages,
  Copy,
  ArrowLeft,
  Info,
  Check,
  User,
  Users,
  ChevronDown,
  Settings2,
} from 'lucide-react';
import { UserSettings, Recording, TranscriptLine } from '../types';
import { recordingsApi } from '../lib/api';
import { createLiveSocket, TranscriptEvent } from '../lib/liveSocket';
import { translateEnToVi } from '../lib/translate';
import {
  floatTo16kPcm,
  int16ToBase64,
  baseMimeType,
  pickRecorderMime,
  preferServerStt,
} from '../lib/mobileStt';
import {
  localizeSpeakerLabel,
  speakerStyleFor,
} from '../lib/speakers';
import {
  estimateApiMsFromDuration,
  useJobProgress,
} from './ui/JobProgress';
import { Socket } from 'socket.io-client';

interface LiveRecordViewProps {
  settings: UserSettings;
  token: string;
  onSaveRecording: (newRec: Recording) => void;
  onCancel: () => void;
}

type TalkMode = 'solo' | 'conversation';
type RecordLang = 'en' | 'vi';

type LiveLine = TranscriptLine & { seq?: number };

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
};

function getSpeechRecognitionCtor():
  | (new () => SpeechRecognitionLike)
  | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export default function LiveRecordView({
  settings,
  token,
  onSaveRecording,
  onCancel,
}: LiveRecordViewProps) {
  const { startJob, updateJob, completeJob, failJob } = useJobProgress();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timer, setTimer] = useState(0);
  const [title, setTitle] = useState(
    () => `Học Tiếng Anh - ${new Date().toLocaleDateString('vi-VN')}`,
  );
  const [category, setCategory] = useState<
    'Học Tiếng Anh' | 'Phỏng vấn' | 'Cuộc họp'
  >('Học Tiếng Anh');
  const [titleManual, setTitleManual] = useState(false);
  const [recordLang, setRecordLang] = useState<RecordLang>('en');
  const [talkMode, setTalkMode] = useState<TalkMode>('solo');
  const [lines, setLines] = useState<LiveLine[]>([]);
  const [partialText, setPartialText] = useState('');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [micActive, setMicActive] = useState(false);
  const [statusMsg, setStatusMsg] = useState(
    'Chọn ngôn ngữ, rồi bấm Bắt đầu để ghi âm',
  );
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sttMode, setSttMode] = useState<'browser' | 'server'>('browser');
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [barsState, setBarsState] = useState<number[]>(
    Array.from({ length: 40 }, () => 20),
  );

  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sttModeRef = useRef<'browser' | 'server'>('browser');
  const recorderMimeRef = useRef('audio/webm');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const wantListeningRef = useRef(false);
  const pausedRef = useRef(false);
  const linesRef = useRef<LiveLine[]>([]);
  const talkModeRef = useRef<TalkMode>('solo');
  const recordLangRef = useRef<RecordLang>('en');
  const timerRef = useRef(0);
  const localSeqRef = useRef(0);

  const meLabel = settings.name?.trim() || 'Bạn';
  /** Server STT + hội thoại → Deepgram tự tách người nói */
  const autoDiarize = talkMode === 'conversation' && sttMode === 'server';

  const currentSpeakerLabel = () => {
    if (talkModeRef.current === 'solo') return meLabel;
    return 'Người nói';
  };

  const resolveSpeaker = (fromServer?: string | null) => {
    if (fromServer?.trim()) return localizeSpeakerLabel(fromServer);
    return currentSpeakerLabel();
  };

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 30);
  };

  const cleanup = useCallback(async () => {
    wantListeningRef.current = false;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    try {
      processorRef.current?.disconnect();
    } catch {
      // ignore
    }
    processorRef.current = null;
    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }
    recognitionRef.current = null;
    if (mediaRecorderRef.current?.state !== 'inactive') {
      try {
        mediaRecorderRef.current?.stop();
      } catch {
        // ignore
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    await audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    socketRef.current?.emit('session.stop');
    socketRef.current?.disconnect();
    socketRef.current = null;
    setMicActive(false);
    setIsRecording(false);
  }, []);

  useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  useEffect(() => {
    talkModeRef.current = talkMode;
  }, [talkMode]);

  useEffect(() => {
    recordLangRef.current = recordLang;
  }, [recordLang]);

  useEffect(() => {
    timerRef.current = timer;
  }, [timer]);

  useEffect(() => {
    if (titleManual) return;
    setTitle(`${category} - ${new Date().toLocaleDateString('vi-VN')}`);
  }, [category, titleManual]);

  const selectCategory = (
    cat: 'Học Tiếng Anh' | 'Phỏng vấn' | 'Cuộc họp',
  ) => {
    setCategory(cat);
    if (!titleManual) {
      setTitle(`${cat} - ${new Date().toLocaleDateString('vi-VN')}`);
    }
  };
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isRecording && !isPaused && !saving) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused, saving]);

  useEffect(() => {
    return () => {
      void cleanup();
    };
  }, [cleanup]);

  const startRecording = async () => {
    if (isRecording || starting || saving) return;
    setStarting(true);
    setStatusMsg('Đang khởi tạo phiên ghi âm...');

    try {
      const SpeechCtor = getSpeechRecognitionCtor();
      // Hội thoại cần server STT (Deepgram diarize) để tách người nói tự động.
      const useServerStt =
        talkModeRef.current === 'conversation' ||
        preferServerStt() ||
        !SpeechCtor;
      sttModeRef.current = useServerStt ? 'server' : 'browser';
      setSttMode(sttModeRef.current);

      if (!useServerStt && !SpeechCtor) {
        setStatusMsg(
          'Trình duyệt không hỗ trợ nhận diện realtime. Dùng Chrome/Edge.',
        );
        return;
      }

      const lang = recordLangRef.current;
      const created = await recordingsApi.create({
        title: title || `${category} - live`,
        category,
      });
      setRecordingId(created.id);

      const socket = createLiveSocket(token);
      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        const timerId = setTimeout(
          () => reject(new Error('Không kết nối được live server')),
          12000,
        );
        socket.on('session.ready', () => {
          clearTimeout(timerId);
          socket.emit(
            'session.start',
            {
              recordingId: created.id,
              category,
              mode: useServerStt ? 'server' : 'browser',
              language: lang,
            },
            (ack: { ok?: boolean; message?: string; provider?: string }) => {
              if (!ack?.ok) {
                reject(new Error(ack?.message || 'Không start được session'));
              } else resolve();
            },
          );
        });
        socket.on('connect_error', (err) => {
          clearTimeout(timerId);
          reject(err);
        });
      });

      const applyLocalTranslation = async (seq: number, text: string) => {
        if (recordLangRef.current !== 'en') return;
        const vi = await translateEnToVi(text);
        if (!vi) return;
        setLines((prev) => {
          const next = prev.map((l) => {
            if (l.seq === seq && !l.translation) {
              return { ...l, translation: vi };
            }
            return l;
          });
          linesRef.current = next;
          return next;
        });
      };

      const appendFinalLine = (
        text: string,
        seqHint?: number,
        translation?: string,
        speakerFromServer?: string,
      ) => {
        const cleaned = text.trim();
        if (!cleaned) return;
        const seq =
          typeof seqHint === 'number' ? seqHint : localSeqRef.current++;
        if (typeof seqHint === 'number') {
          localSeqRef.current = Math.max(localSeqRef.current, seqHint + 1);
        }
        const speaker = resolveSpeaker(speakerFromServer);
        const timeLabel = formatTimer(timerRef.current).substring(3);
        setPartialText('');
        setLines((prev) => {
          if (prev.some((l) => l.seq === seq)) {
            const next = prev.map((l) =>
              l.seq === seq
                ? {
                    ...l,
                    text: cleaned,
                    speaker,
                    translation: translation || l.translation,
                  }
                : l,
            );
            linesRef.current = next;
            return next;
          }
          const next = [
            ...prev,
            { time: timeLabel, speaker, text: cleaned, seq, translation },
          ];
          linesRef.current = next;
          return next;
        });
        scrollToBottom();
        if (recordLangRef.current === 'en' && !translation) {
          void applyLocalTranslation(seq, cleaned);
        }
      };

      socket.on('transcript.translation', (ev: TranscriptEvent) => {
        if (!ev.translation) return;
        setLines((prev) => {
          const next = prev.map((l) => {
            if (l.seq !== undefined && l.seq === ev.seq) {
              return { ...l, translation: ev.translation, seq: ev.seq };
            }
            if (!l.translation && l.text === ev.text) {
              return { ...l, translation: ev.translation, seq: ev.seq };
            }
            return l;
          });
          linesRef.current = next;
          return next;
        });
      });

      if (useServerStt) {
        socket.on('transcript.partial', (ev: TranscriptEvent) => {
          if (pausedRef.current || !ev.text?.trim()) return;
          const who = resolveSpeaker(ev.speaker);
          setPartialText(`${who}: ${ev.text.trim()}`);
          scrollToBottom();
        });
        socket.on('transcript.final', (ev: TranscriptEvent) => {
          if (pausedRef.current || !ev.text?.trim()) return;
          appendFinalLine(ev.text, ev.seq, ev.translation, ev.speaker);
          setStatusMsg(
            talkModeRef.current === 'conversation'
              ? lang === 'vi'
                ? 'Đang nghe · tự nhận diện người nói...'
                : 'Đang nghe · dịch Việt · tự nhận diện người nói...'
              : lang === 'vi'
                ? 'Đang nghe (server STT)...'
                : 'Đang nghe · dịch Việt (server STT)...',
          );
        });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: settings.aiNoiseCancellation,
          noiseSuppression: settings.aiNoiseCancellation,
        },
      });
      streamRef.current = stream;
      setMicActive(true);

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      source.connect(analyser);
      analyser.fftSize = 64;
      audioContextRef.current = audioCtx;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(dataArray);
        setBarsState(
          Array.from({ length: 40 }, (_, i) => {
            const val =
              dataArray[Math.floor((i / 40) * dataArray.length)] || 0;
            return Math.max(12, (val / 255) * 85);
          }),
        );
        animationRef.current = requestAnimationFrame(tick);
      };
      tick();

      const mime = pickRecorderMime();
      recorderMimeRef.current = mime || 'audio/webm';
      // ~32kbps đủ cho giọng nói → 1 giờ ≈ 14MB; Hobby Blob 1GB ≈ nhiều giờ demo
      const recorderOpts: MediaRecorderOptions = {
        audioBitsPerSecond: 32_000,
      };
      if (mime) recorderOpts.mimeType = mime;
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, recorderOpts);
      } catch {
        recorder = mime
          ? new MediaRecorder(stream, { mimeType: mime })
          : new MediaRecorder(stream);
      }
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.start(1000);

      if (useServerStt) {
        // Mobile: stream PCM → Deepgram/Gemini (Web Speech conflicts with MediaRecorder).
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        const silent = audioCtx.createGain();
        silent.gain.value = 0;
        source.connect(processor);
        processor.connect(silent);
        silent.connect(audioCtx.destination);

        processor.onaudioprocess = (ev) => {
          if (pausedRef.current || !wantListeningRef.current) return;
          const input = ev.inputBuffer.getChannelData(0);
          const pcm = floatTo16kPcm(input, audioCtx.sampleRate);
          if (pcm.length === 0) return;
          socket.emit('audio.chunk', {
            data: int16ToBase64(pcm),
            mimeType: 'audio/l16;rate=16000',
          });
        };
      } else if (SpeechCtor) {
        const recognition = new SpeechCtor();
        // Vietnamese is more stable with continuous=false + restart on end
        recognition.continuous = lang !== 'vi';
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event) => {
          if (pausedRef.current) return;
          let interim = '';
          let finalChunk = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0].transcript.trim();
            if (!text) continue;
            if (result.isFinal) finalChunk += (finalChunk ? ' ' : '') + text;
            else interim += text;
          }

          const speaker = currentSpeakerLabel();

          if (interim) {
            setPartialText(`${speaker}: ${interim}`);
            scrollToBottom();
          }

          if (finalChunk) {
            const seq = localSeqRef.current++;
            appendFinalLine(finalChunk, seq);
            socket.emit('transcript.utterance', {
              text: finalChunk,
              isFinal: true,
              speaker,
              seq,
            });
            setStatusMsg(
              recordLangRef.current === 'en'
                ? 'Đang nghe · dịch Việt...'
                : 'Đang nghe tiếng Việt...',
            );
          }
        };

        recognition.onerror = (event) => {
          if (event.error === 'no-speech' || event.error === 'aborted') return;
          if (event.error === 'not-allowed') {
            setStatusMsg('Chưa cấp quyền microphone');
            wantListeningRef.current = false;
            return;
          }
          if (event.error === 'network') {
            setStatusMsg('STT mạng lỗi — đang thử lại...');
            return;
          }
          if (event.error === 'language-not-supported') {
            setStatusMsg(
              'Trình duyệt không hỗ trợ STT tiếng Việt — thử Chrome hoặc chế độ mobile (server STT)',
            );
            wantListeningRef.current = false;
            return;
          }
          setStatusMsg(`Lỗi nhận diện: ${event.error}`);
        };

        recognition.onend = () => {
          if (!wantListeningRef.current || pausedRef.current) return;
          // Short delay avoids "already started" races, esp. for vi-VN
          window.setTimeout(() => {
            if (!wantListeningRef.current || pausedRef.current) return;
            try {
              recognition.start();
            } catch {
              // already started
            }
          }, lang === 'vi' ? 250 : 50);
        };

        recognition.start();
      }

      wantListeningRef.current = true;
      pausedRef.current = false;
      setIsPaused(false);
      setIsRecording(true);
      if (useServerStt) {
        setStatusMsg(
          lang === 'vi'
            ? 'Điện thoại: đang ghi + STT server — nói đi'
            : 'Điện thoại: đang ghi + STT server — chữ Anh + dịch Việt',
        );
      } else {
        setStatusMsg(
          lang === 'vi'
            ? 'Đang ghi tiếng Việt — nói đi, chữ hiện ngay'
            : 'Đang ghi tiếng Anh — chữ Anh + dịch Việt',
        );
      }
    } catch (err) {
      setStatusMsg(
        err instanceof Error
          ? err.message
          : 'Không thể truy cập microphone hoặc API',
      );
      await cleanup();
    } finally {
      setStarting(false);
    }
  };

  const togglePause = () => {
    if (!isRecording) return;
    const next = !isPaused;
    setIsPaused(next);
    pausedRef.current = next;
    if (next) {
      if (sttModeRef.current === 'browser') {
        try {
          recognitionRef.current?.stop();
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current?.pause();
      socketRef.current?.emit('session.pause');
      setStatusMsg('Đã tạm dừng');
    } else {
      mediaRecorderRef.current?.resume();
      socketRef.current?.emit('session.resume');
      if (sttModeRef.current === 'browser') {
        try {
          recognitionRef.current?.start();
        } catch {
          // ignore
        }
      }
      setStatusMsg(
        sttModeRef.current === 'server'
          ? 'Đang nghe (server STT)...'
          : 'Đang nghe realtime...',
      );
    }
  };

  useEffect(() => {
    // Khi đang ghi: thu gọn settings để nhường chỗ transcript
    if (isRecording) setSettingsOpen(false);
  }, [isRecording]);

  const handleSave = async () => {
    if (!recordingId || saving || !isRecording) return;
    setSaving(true);
    setStatusMsg('Đang lưu bản ghi...');
    wantListeningRef.current = false;
    const idToSave = recordingId;
    const uploadJobId = startJob('Upload audio', {
      detail: 'Đang chuẩn bị file…',
      estimatedMs: estimateApiMsFromDuration(timerRef.current || timer, 'upload'),
    });
    let finalizeJobId: string | null = null;
    let uploadDone = false;
    try {
      try {
        recognitionRef.current?.stop();
      } catch {
        // ignore
      }
      if (mediaRecorderRef.current?.state !== 'inactive') {
        await new Promise<void>((resolve) => {
          const rec = mediaRecorderRef.current!;
          rec.onstop = () => resolve();
          try {
            if (rec.state === 'recording') {
              rec.requestData();
            }
            rec.stop();
          } catch {
            resolve();
          }
        });
      }
      socketRef.current?.emit('session.stop');

      const blob = new Blob(chunksRef.current, {
        type: baseMimeType(recorderMimeRef.current || 'audio/webm'),
      });
      if (blob.size === 0) {
        throw new Error('Không có dữ liệu âm thanh để upload');
      }
      const sizeMb = (blob.size / (1024 * 1024)).toFixed(1);
      updateJob(uploadJobId, {
        detail: `Đang upload ${sizeMb} MB lên cloud…`,
      });
      setStatusMsg(`Đang upload audio (${sizeMb} MB) lên cloud...`);
      await recordingsApi.uploadAudio(idToSave, blob, (pct) => {
        updateJob(uploadJobId, {
          progress: pct,
          detail: `Upload audio… ${pct}%`,
        });
        setStatusMsg(`Đang upload audio... ${pct}%`);
      });
      completeJob(uploadJobId, 'Audio đã lưu');
      uploadDone = true;

      finalizeJobId = startJob('Lưu transcript', {
        detail: 'Ghi metadata + transcript lên Firestore…',
        estimatedMs: Math.min(
          25_000,
          Math.max(4_000, 3_000 + (linesRef.current.length || 1) * 120),
        ),
      });
      setStatusMsg('Audio OK — đang lưu transcript lên Firestore...');
      const saved = await recordingsApi.finalize(idToSave, {
        title:
          title || `${category} - ${new Date().toLocaleDateString('vi-VN')}`,
        category,
        durationSec: timerRef.current || timer,
        transcript: linesRef.current.map(
          ({ time, speaker, text, translation }) => ({
            time,
            speaker,
            text,
            translation,
          }),
        ),
        generateSummary: false,
      });
      completeJob(finalizeJobId, 'Đã lưu transcript');

      await cleanup();
      onSaveRecording(saved);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lưu thất bại';
      if (!uploadDone) failJob(uploadJobId, msg.slice(0, 120));
      if (finalizeJobId) failJob(finalizeJobId, msg.slice(0, 120));
      setStatusMsg(
        `${msg} — transcript chưa ghi DB (cần audio thành công trước).`,
      );
      setSaving(false);
      // Keep draft recordingId for retry; do not finalize without audio.
      wantListeningRef.current = true;
      if (sttModeRef.current === 'browser') {
        try {
          recognitionRef.current?.start();
        } catch {
          // ignore
        }
      }
    }
  };

  const handleCancel = async () => {
    await cleanup();
    if (recordingId) {
      try {
        await recordingsApi.remove(recordingId);
      } catch {
        // ignore
      }
    }
    onCancel();
  };

  const copyAll = () => {
    const text = lines
      .map((l) => {
        if (recordLang === 'vi' || !l.translation) {
          return `${l.speaker}: ${l.text}`;
        }
        return `${l.speaker}: ${l.text}\n   -> ${l.translation}`;
      })
      .join('\n\n');
    void navigator.clipboard.writeText(text);
  };

  const langLocked = isRecording || starting;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="px-4 md:px-8 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void handleCancel()}
            className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-extrabold text-blue-600 uppercase tracking-widest">
              {isRecording ? 'Đang ghi âm' : 'Ghi âm mới'}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitleManual(true);
                  setTitle(e.target.value);
                }}
                placeholder="Nhập tiêu đề bản ghi..."
                className="text-sm md:text-base font-bold bg-transparent border-none p-0 outline-none max-w-[240px] truncate"
              />
              {titleManual && (
                <button
                  type="button"
                  onClick={() => {
                    setTitleManual(false);
                    setTitle(
                      `${category} - ${new Date().toLocaleDateString('vi-VN')}`,
                    );
                  }}
                  className="shrink-0 text-[10px] font-bold text-blue-600 hover:underline"
                >
                  Mặc định
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-full text-[10px] font-extrabold">
              <span className="w-2 h-2 bg-rose-600 rounded-full animate-ping" />
              LIVE
            </span>
          )}
          <span className="font-mono text-xs font-bold bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
            {formatTimer(timer)}
          </span>
        </div>
      </header>

      {/* Record controls at top so mobile bottom nav cannot cover Start/Save */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2.5 z-20">
        <div className="flex items-center justify-between w-full max-w-4xl mx-auto gap-3">
          <button
            type="button"
            onClick={() => void handleCancel()}
            className="flex flex-col items-center text-[10px] font-bold text-slate-500 min-w-[52px]"
          >
            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <Square className="w-3.5 h-3.5" />
            </div>
            Hủy
          </button>
          <div className="flex items-center gap-3">
            {isRecording ? (
              <>
                <button
                  type="button"
                  onClick={togglePause}
                  className="w-11 h-11 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center"
                  title={isPaused ? 'Tiếp tục' : 'Tạm dừng'}
                >
                  {isPaused ? (
                    <Play className="w-4 h-4 fill-current" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="w-14 h-14 md:w-16 md:h-16 bg-blue-600 hover:bg-blue-700 rounded-full text-white shadow-lg border-4 border-white dark:border-slate-950 disabled:opacity-50"
                  title="Lưu / Kết thúc"
                >
                  <Save className="w-6 h-6 mx-auto" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => void startRecording()}
                disabled={starting}
                className="w-14 h-14 md:w-16 md:h-16 bg-rose-600 hover:bg-rose-700 rounded-full text-white shadow-lg border-4 border-white dark:border-slate-950 disabled:opacity-50 flex items-center justify-center"
                title="Bắt đầu"
              >
                <Mic className="w-7 h-7" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() =>
              isRecording ? void handleSave() : void startRecording()
            }
            disabled={saving || starting}
            className="flex flex-col items-center text-[10px] font-extrabold text-blue-600 min-w-[52px]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              {isRecording ? (
                <Save className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </div>
            {saving
              ? '...'
              : starting
                ? '...'
                : isRecording
                  ? 'Kết thúc'
                  : 'Bắt đầu'}
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-3 md:p-4 gap-3 overflow-hidden">
        {/* Settings bubble — collapsed by default while recording */}
        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 overflow-hidden">
          <button
            type="button"
            onClick={() => setSettingsOpen((o) => !o)}
            className="w-full px-3.5 py-2.5 flex items-center gap-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
          >
            <Settings2 className="w-4 h-4 text-blue-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Cài đặt ghi âm
              </p>
              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate">
                {recordLang === 'en' ? 'EN' : 'VI'}
                {' · '}
                {talkMode === 'solo' ? '1 người' : 'Hội thoại'}
                {' · '}
                {category}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${
                settingsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {settingsOpen && (
            <div className="px-3.5 pb-3 pt-0 space-y-3 border-t border-slate-100 dark:border-slate-800">
              <div className="pt-3 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  Ngôn ngữ ghi âm
                </span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    disabled={langLocked}
                    onClick={() => setRecordLang('en')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                      recordLang === 'en'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    } disabled:opacity-60`}
                  >
                    {recordLang === 'en' && (
                      <Check className="w-3.5 h-3.5 inline mr-1" />
                    )}
                    Tiếng Anh
                  </button>
                  <button
                    type="button"
                    disabled={langLocked}
                    onClick={() => setRecordLang('vi')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold ${
                      recordLang === 'vi'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    } disabled:opacity-60`}
                  >
                    {recordLang === 'vi' && (
                      <Check className="w-3.5 h-3.5 inline mr-1" />
                    )}
                    Tiếng Việt
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  {recordLang === 'en'
                    ? 'STT tiếng Anh → hiện chữ Anh + dịch Việt.'
                    : 'STT tiếng Việt → hiện chữ tiếng Việt.'}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  Chế độ nói
                </span>
                <div className="flex gap-1 flex-wrap">
                  <button
                    type="button"
                    disabled={langLocked}
                    onClick={() => setTalkMode('solo')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
                      talkMode === 'solo'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    } disabled:opacity-60`}
                  >
                    <User className="w-3.5 h-3.5" />1 người nói
                  </button>
                  <button
                    type="button"
                    disabled={langLocked}
                    onClick={() => setTalkMode('conversation')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
                      talkMode === 'conversation'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800'
                    } disabled:opacity-60`}
                  >
                    <Users className="w-3.5 h-3.5" /> Hội thoại
                  </button>
                </div>
                {talkMode === 'conversation' && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Server STT tự nhận diện người nói (Người nói 1, 2, …).
                    </p>
                    {autoDiarize && (
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-600">
                          Đang tự nhận diện
                        </span>
                        {[...new Set(lines.map((l) => l.speaker))].map(
                          (name) => {
                            const style = speakerStyleFor(
                              name,
                              lines.map((l) => l.speaker),
                            );
                            return (
                              <span
                                key={name}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${style.chip}`}
                              >
                                {name}
                              </span>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase text-slate-400">
                  Mục đích
                </span>
                <div className="flex gap-1 flex-wrap">
                  {(
                    ['Học Tiếng Anh', 'Phỏng vấn', 'Cuộc họp'] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      disabled={langLocked}
                      onClick={() => selectCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        category === cat
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800'
                      } disabled:opacity-60`}
                    >
                      {category === cat && (
                        <Check className="w-3.5 h-3.5 inline" />
                      )}{' '}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-1.5 text-[11px] text-slate-500 pt-1">
                <Info className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between h-14 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
            <Mic className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {!isRecording
                ? 'Chưa bắt đầu'
                : micActive
                  ? talkMode === 'solo'
                    ? `1 người · ${meLabel}`
                    : autoDiarize
                      ? 'Hội thoại · tự nhận diện giọng'
                      : `Hội thoại · ${currentSpeakerLabel()}`
                  : 'Chưa có mic'}
            </span>
          </div>
          <div className="flex items-end gap-[2px] h-8 max-w-md w-full justify-end">
            {barsState.map((height, i) => (
              <div
                key={i}
                style={{ height: `${height * 0.4}%` }}
                className={`w-[3px] rounded-full ${
                  micActive && isRecording && !isPaused
                    ? 'bg-blue-600'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>
        </section>

        <section className="flex-1 min-h-0 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
              <Languages className="w-4 h-4 text-blue-600" />
              {recordLang === 'en'
                ? 'Song ngữ Anh → Việt (live)'
                : 'Transcript tiếng Việt (live)'}
            </span>
            <button
              onClick={copyAll}
              className="text-[11px] font-bold text-blue-600 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
          </div>
          <div
            ref={scrollRef}
            className="flex-1 min-h-0 p-4 pb-6 overflow-y-auto space-y-3 overscroll-contain"
          >
            {lines.map((line, idx) => {
              const style = speakerStyleFor(
                line.speaker,
                lines.map((l) => l.speaker),
              );
              return (
                <div
                  key={`${line.time}-${idx}-${line.text.slice(0, 12)}`}
                  className={`p-4 rounded-xl border ${style.card}`}
                >
                  <div className="text-[10px] font-extrabold text-slate-400 mb-2 flex items-center gap-2">
                    <span className={style.text}>{line.speaker}</span>
                    <span>· {line.time}</span>
                  </div>
                  {recordLang === 'en' ? (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Tiếng Anh
                      </p>
                      <p className="text-base md:text-lg font-bold">
                        {line.text}
                      </p>
                      {line.translation ? (
                        <>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500 mt-3 mb-1">
                            Tiếng Việt
                          </p>
                          <p className="text-blue-600 font-semibold text-sm md:text-base pt-2 border-t border-dashed border-slate-200">
                            {line.translation}
                          </p>
                        </>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic mt-2">
                          Đang dịch sang tiếng Việt...
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Tiếng Việt
                      </p>
                      <p className="text-base md:text-lg font-bold">
                        {line.text}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
            {partialText && (
              <div className="p-4 rounded-xl border-l-4 border-l-blue-600 bg-blue-500/5">
                <span className="text-[9px] font-extrabold text-blue-600 animate-pulse">
                  ĐANG NÓI...
                </span>
                <p className="text-base font-bold mt-1">{partialText}</p>
              </div>
            )}
            {!lines.length && !partialText && (
              <div className="py-12 text-center text-slate-500 text-sm">
                {isRecording
                  ? recordLang === 'vi'
                    ? 'Hãy nói tiếng Việt — chữ hiện ngay bên dưới.'
                    : 'Hãy nói tiếng Anh — chữ Anh hiện ngay, bản dịch Việt cập nhật bên dưới.'
                  : 'Chọn ngôn ngữ rồi bấm Bắt đầu để ghi âm.'}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
