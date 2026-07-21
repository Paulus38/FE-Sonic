import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { Recording } from '../types';
import { recordingsApi } from '../lib/api';

interface FloatingPlayerProps {
  recording: Recording | null;
  onClose: () => void;
}

export default function FloatingPlayer({
  recording,
  onClose,
}: FloatingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [status, setStatus] = useState('Đang tải audio...');

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!recording) return;
      setStatus('Đang tải audio...');
      setCurrentTime(0);
      setIsPlaying(false);

      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Refresh metadata in case list item is stale
      let meta = recording;
      try {
        meta = await recordingsApi.get(recording.id);
      } catch {
        // use list item
      }
      if (cancelled) return;

      if (!meta.hasAudio) {
        setStatus('Bản ghi chưa có file âm thanh — ghi lại và bấm Lưu');
        setDuration(meta.durationSec || 0);
        return;
      }

      try {
        const url = await recordingsApi.fetchAudioObjectUrl(meta.id);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audio.preload = 'auto';
        audio.volume = volume / 100;
        audioRef.current = audio;

        audio.onloadedmetadata = () => {
          setDuration(Number.isFinite(audio.duration) ? audio.duration : meta.durationSec || 0);
          setStatus('');
        };
        audio.oncanplay = () => setStatus('');
        audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
        audio.onended = () => setIsPlaying(false);
        audio.onerror = () => {
          setStatus('Trình duyệt không phát được file (thử Chrome).');
          setIsPlaying(false);
        };

        await audio.play();
        if (!cancelled) setIsPlaying(true);
      } catch (err) {
        setStatus(
          err instanceof Error ? err.message : 'Không tải được file âm thanh',
        );
      }
    };

    void setup();
    return () => {
      cancelled = true;
      audioRef.current?.pause();
      audioRef.current = null;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  if (!recording) return null;

  const formatTime = (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds || 0));
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const total = duration || recording.durationSec || 1;
  const progress = Math.min(100, (currentTime / total) * 100);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play().then(() => setIsPlaying(true));
    }
  };

  const seekBy = (delta: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(total, audio.currentTime + delta));
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 border border-slate-200 dark:border-slate-800 rounded-2xl md:rounded-full px-4 md:px-6 py-3 shadow-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-6 z-50 w-[calc(100%-1.5rem)] max-w-4xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-md">
      <div className="flex flex-col min-w-0 md:max-w-[240px]">
        <span className="text-sm font-bold truncate">{recording.title}</span>
        <span className="text-xs text-slate-500 font-medium">
          {status || `${formatTime(currentTime)} / ${formatTime(total)}`}
        </span>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => seekBy(-10)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={togglePlay}
          disabled={!!status && !audioRef.current}
          className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center disabled:opacity-40"
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 fill-white ml-0.5" />}
        </button>
        <button onClick={() => seekBy(10)} className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      <div className="hidden sm:flex items-center gap-2 w-28">
        <Volume2 className="w-4 h-4 text-slate-400" />
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>

      <button onClick={onClose} className="absolute md:static top-2 right-2 p-1 text-slate-400 hover:text-slate-700">
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
