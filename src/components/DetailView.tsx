import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Download, 
  Sparkles, 
  Users, 
  Tag, 
  Lightbulb, 
  Volume2, 
  RotateCcw, 
  RotateCw, 
  Play, 
  Pause, 
  Bookmark, 
  Edit3, 
  MoreVertical,
  CheckCircle,
  Clock,
  BookOpen,
  Languages,
  Eye,
  Plus
} from 'lucide-react';
import { Recording, DictionaryItem } from '../types';
import { recordingsApi } from '../lib/api';

interface DetailViewProps {
  recording: Recording;
  onBack: () => void;
  onAddWordToDictionary: (item: Omit<DictionaryItem, 'id'>) => void;
  onRegenerateSummary: (recordingId: string) => void;
}

export default function DetailView({ recording, onBack, onAddWordToDictionary, onRegenerateSummary }: DetailViewProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); 
  const [speed, setSpeed] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(80);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState('');
  
  // Custom display modes for English learners
  const [showBilingual, setShowBilingual] = useState(true);

  // Mobile active tab: 'transcript' | 'summary' | 'vocabulary'
  const [activeMobileTab, setActiveMobileTab] = useState<'transcript' | 'summary' | 'vocabulary'>('transcript');

  // Quick dictionary popover state
  const [selectedWordInfo, setSelectedWordInfo] = useState<{
    word: string;
    phonetic: string;
    definition: string;
    example: string;
  } | null>(null);
  const [hydratedRecording, setHydratedRecording] = useState<Recording | null>(null);

  // Parse time string "MM:SS" into seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
  };

  // Convert seconds into formatted MM:SS
  const formatTime = (totalSec: number): string => {
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    let cancelled = false;
    setCurrentTime(0);
    setIsPlaying(false);
    setAudioReady(false);
    setAudioError('');

    const load = async () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      audioRef.current?.pause();
      audioRef.current = null;

      if (!recording.hasAudio) {
        setAudioError('Chưa có file âm thanh');
        return;
      }
      try {
        const url = await recordingsApi.fetchAudioObjectUrl(recording.id);
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        objectUrlRef.current = url;
        const audio = new Audio(url);
        audio.volume = volume / 100;
        audio.playbackRate = speed;
        audioRef.current = audio;
        audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
        audio.onended = () => setIsPlaying(false);
        audio.onloadedmetadata = () => setAudioReady(true);
        audio.onerror = () => setAudioError('Không phát được audio — dùng Chrome');
        setAudioReady(true);
      } catch (err) {
        setAudioError(err instanceof Error ? err.message : 'Lỗi tải audio');
      }
    };
    void load();

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
  }, [recording.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    let cancelled = false;
    setHydratedRecording(null);
    recordingsApi
      .get(recording.id)
      .then((full) => {
        if (!cancelled) setHydratedRecording(full);
      })
      .catch(() => {
        // keep fallback data from list
      });
    return () => {
      cancelled = true;
    };
  }, [recording.id]);

  const transcriptLines =
    hydratedRecording?.transcript?.length
      ? hydratedRecording.transcript
      : recording.transcript || [];
  const aiSummaryText =
    hydratedRecording?.aiSummary?.trim() || recording.aiSummary || '';

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

  // Determine active statement index based on currentTime
  const getActiveStatementIndex = () => {
    let activeIdx = 0;
    const lines = transcriptLines;
    for (let i = 0; i < lines.length; i++) {
      const lineSec = parseTimeToSeconds(lines[i].time);
      if (currentTime >= lineSec) {
        activeIdx = i;
      }
    }
    return activeIdx;
  };

  const activeStatementIdx = getActiveStatementIndex();

  const handleSpeakerBlockClick = (timeStr: string) => {
    const targetSec = parseTimeToSeconds(timeStr);
    setCurrentTime(targetSec);
    if (audioRef.current) {
      audioRef.current.currentTime = targetSec;
      void audioRef.current.play().then(() => setIsPlaying(true));
    } else {
      setIsPlaying(true);
    }
  };

  // Vocabulary keywords specifically designed for each mockup for interactive English learning
  const keywordsList: { word: string; phonetic: string; definition: string; example: string; category: string }[] = [
    {
      word: 'Deliverable',
      phonetic: '/dɪˈlɪv.ər.ə.bəl/',
      definition: 'Sản phẩm bàn giao (báo cáo, thiết kế, code...) cho đối tác/khách hàng.',
      example: 'We must align on design deliverables before Friday.',
      category: 'Học Tiếng Anh'
    },
    {
      word: 'Align with',
      phonetic: '/əˈlaɪn wɪð/',
      definition: 'Thống nhất, đồng bộ hoặc phù hợp hoàn toàn với định hướng/thương hiệu.',
      example: 'Does this color palette align with our brand identity?',
      category: 'Học Tiếng Anh'
    },
    {
      word: 'Pain point',
      phonetic: '/peɪn pɔɪnt/',
      definition: 'Điểm đau, vấn đề khó khăn lớn nhất mà người dùng đang gặp phải.',
      example: 'The primary user pain point is the slow loading speed of dynamic charts.',
      category: 'Phỏng vấn'
    },
    {
      word: 'Readability',
      phonetic: '/ˌriː.dəˈbɪl.ə.ti/',
      definition: 'Khả năng đọc hiểu, độ dễ đọc (nhất là trên điện thoại di động).',
      example: 'To improve readability on mobile devices, use a larger font size.',
      category: 'Học Tiếng Anh'
    }
  ];

  const handleSaveWord = (wordObj: typeof keywordsList[0]) => {
    onAddWordToDictionary({
      word: wordObj.word,
      phonetic: wordObj.phonetic,
      definition: wordObj.definition,
      example: wordObj.example,
      category: wordObj.category
    });

    // Show temporary banner instead of blocking iframe alert
    const banner = document.createElement('div');
    banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50';
    banner.innerText = `✓ Đã thêm từ "${wordObj.word}" vào Từ điển của bạn!`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2500);
  };

  // Custom text highlight parser for interactive dictionary lookup
  const renderTextWithHighlights = (text: string, isCurrentActive: boolean) => {
    const words = text.split(' ');
    return (
      <span>
        {words.map((word, index) => {
          const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
          const keywordMatch = keywordsList.find(kw => kw.word.toLowerCase() === cleanWord.toLowerCase() || cleanWord.toLowerCase().startsWith(kw.word.toLowerCase().split(' ')[0]));
          
          if (keywordMatch) {
            return (
              <span 
                key={index} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedWordInfo(keywordMatch);
                }}
                className={`cursor-help px-1 rounded font-bold underline decoration-indigo-400 decoration-2 underline-offset-4 transition-all ${
                  isCurrentActive 
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-indigo-950 dark:text-white' 
                    : 'text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                } mr-1 inline-block`}
                title="Nhấp để xem nghĩa & lưu từ vựng"
              >
                {word}
              </span>
            );
          }
          return <span key={index} className="mr-1 inline-block">{word}</span>;
        })}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors pb-32 md:pb-28">
      
      {/* Top Header Bar: Responsive and Compact */}
      <header className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 shadow-xs transition-colors z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="max-w-[150px] sm:max-w-xs md:max-w-md">
            <h2 className="text-sm md:text-base font-extrabold text-slate-950 dark:text-white leading-tight line-clamp-1">
              {recording.title}
            </h2>
            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">
              {recording.date} • {recording.category}
            </p>
          </div>
        </div>

        {/* Control utility buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Bilingual view toggle for English Learning */}
          <button 
            onClick={() => setShowBilingual(!showBilingual)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              showBilingual 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200/50' 
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
            }`}
            title="Bật/Tắt dòng dịch tiếng Việt học tập"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{showBilingual ? 'Song ngữ: Bật' : 'Song ngữ: Tắt'}</span>
          </button>

          <button className="flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[38px]">
            <Share2 className="w-4 h-4" /> 
            <span className="hidden xs:inline">Chia sẻ</span>
          </button>
        </div>
      </header>

      {/* MOBILE TAB LIST (Shown only on Mobile <md) */}
      <div className="md:hidden flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 p-1">
        <button
          onClick={() => setActiveMobileTab('transcript')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeMobileTab === 'transcript' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          Hội thoại
        </button>
        <button
          onClick={() => setActiveMobileTab('summary')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeMobileTab === 'summary' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          Tóm tắt AI
        </button>
        <button
          onClick={() => setActiveMobileTab('vocabulary')}
          className={`flex-1 py-2 text-xs font-extrabold rounded-lg transition-all ${
            activeMobileTab === 'vocabulary' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500'
          }`}
        >
          Từ vựng
        </button>
      </div>

      {/* Split Body Layout (Adaptive sidebars) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Column: Transcript Stream (Visible if active in mobile, always visible on desktop) */}
        <section className={`flex-1 overflow-y-auto px-4 md:px-8 py-6 bg-white dark:bg-slate-900 transition-all ${
          activeMobileTab === 'transcript' ? 'block' : 'hidden md:block'
        }`}>
          <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
            
            {/* Context learning hint card */}
            <div className="p-3.5 bg-indigo-50/60 dark:bg-slate-800/50 rounded-xl border border-indigo-100/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
              <Eye className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-slate-800 dark:text-white mb-0.5">Mẹo tự học Tiếng Anh hiệu quả:</p>
                <p>Các từ vựng gạch chân nét đậm là từ khóa cốt lõi trong cuộc họp/phỏng vấn. Hãy <strong className="text-blue-600 dark:text-blue-400">nhấn vào từ đó</strong> để mở thẻ định nghĩa nhanh và lưu vào Từ điển học tập!</p>
              </div>
            </div>

            {transcriptLines.map((line, idx) => {
              const isActive = idx === activeStatementIdx;
              const speakerColor = idx % 2 === 0 
                ? 'text-blue-600 dark:text-blue-400' 
                : 'text-orange-600 dark:text-orange-400';

              return (
                <div 
                  key={idx} 
                  onClick={() => handleSpeakerBlockClick(line.time)}
                  className={`flex flex-col sm:flex-row gap-2 sm:gap-4 cursor-pointer p-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-500/5 dark:bg-blue-500/10 border-l-4 border-blue-600 shadow-xs' 
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Timestamp Box */}
                  <div className="flex items-center sm:items-start justify-between sm:justify-start flex-none gap-2">
                    <span className={`text-[10px] md:text-xs font-extrabold px-2 py-0.5 rounded-md transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800'
                    }`}>
                      {line.time}
                    </span>
                    <span className={`sm:hidden text-xs font-bold uppercase tracking-wider ${speakerColor}`}>
                      {line.speaker}
                    </span>
                  </div>

                  {/* Speaker and Speech Content */}
                  <div className="space-y-1.5 flex-1">
                    <h4 className={`hidden sm:block text-xs font-bold uppercase tracking-wider ${speakerColor}`}>
                      {line.speaker}
                    </h4>
                    
                    {/* English Original */}
                    <p className={`text-[14px] md:text-base leading-relaxed transition-all ${
                      isActive 
                        ? 'text-slate-950 dark:text-white font-bold' 
                        : 'text-slate-800 dark:text-slate-300 font-semibold'
                    }`}>
                      {renderTextWithHighlights(line.text, isActive)}
                    </p>

                    {/* Bilingual Vietnamese Translation */}
                    {showBilingual && (line.translation || (recording as any).isTranslated) && (
                      <p className={`text-xs md:text-sm leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-1 text-slate-500 dark:text-slate-400 font-medium italic ${
                        isActive ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''
                      }`}>
                        {line.translation || "Bản dịch tương ứng đang cập nhật..."}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {transcriptLines.length === 0 && (
              <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                Chưa có nội dung transcript cho bản ghi này. Vui lòng thử ghi âm lại hoặc kiểm tra quá trình finalize.
              </div>
            )}
          </div>
        </section>

        {/* Right Sidebar: AI Summary & Participants (Always on Desktop, responsive on Mobile) */}
        <aside className={`w-full md:w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 overflow-y-auto px-4 md:px-6 py-6 space-y-6 md:space-y-8 transition-all ${
          activeMobileTab === 'summary' ? 'block' : 'hidden md:block'
        }`}>
          
          {/* AI Summary Card */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400 animate-pulse" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">Phân tích & Tóm tắt AI</h3>
              <button
                onClick={() => onRegenerateSummary(recording.id)}
                className="ml-auto text-[10px] font-bold px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
              >
                Làm mới AI
              </button>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm leading-relaxed transition-colors">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-extrabold uppercase tracking-wider mb-2.5">
                Các điểm cốt lõi:
              </p>
              <ul className="space-y-2.5 text-slate-700 dark:text-slate-300 text-xs md:text-sm font-medium pl-3 list-disc">
                {(aiSummaryText || 'Chưa có tóm tắt AI. Bấm "Làm mới AI".')
                  .split('\n')
                  .filter(Boolean)
                  .map((bullet, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {bullet.replace(/^-\s*/, '')}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Participants */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-slate-500" />
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">Người tham gia</h3>
            </div>
            <div className="space-y-3">
              {recording.participants && recording.participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                  <img 
                    src={p.avatar} 
                    alt={p.name} 
                    className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white leading-tight">{p.name}</p>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-0.5 uppercase tracking-wider">{p.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Action tags */}
          {recording.tags && recording.tags.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4.5 h-4.5 text-slate-500" />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">Nhãn hội thoại</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recording.tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-extrabold"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </section>
          )}

        </aside>

        {/* Vocabulary Study Tab Column (Visible only on mobile vocabulary active tab, but desktop can view it via selected dictionary popover or keywords) */}
        <section className={`w-full md:w-80 shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 overflow-y-auto px-4 py-6 space-y-6 ${
          activeMobileTab === 'vocabulary' ? 'block' : 'hidden md:block'
        }`}>
          <div className="flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800 dark:text-slate-200">Từ vựng rút gọn</h3>
          </div>

          <div className="space-y-4">
            {keywordsList.map((kw, idx) => (
              <div 
                key={idx} 
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-2 relative overflow-hidden shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-sm text-indigo-950 dark:text-white">{kw.word}</h4>
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-bold">{kw.phonetic}</span>
                  </div>
                  
                  <button 
                    onClick={() => handleSaveWord(kw)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400 p-1.5 rounded-lg text-xs font-bold transition-all min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Lưu từ vựng vào Từ điển cá nhân"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800/50">
                  {kw.definition}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                  <strong>Ví dụ:</strong> "{kw.example}"
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* Word info quick modal popup (if a highlighted word was clicked) */}
      {selectedWordInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] uppercase font-extrabold tracking-widest text-blue-600 dark:text-blue-400">Tra cứu nhanh</span>
                <h3 className="text-lg font-extrabold text-indigo-950 dark:text-white mt-1">{selectedWordInfo.word}</h3>
                <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-bold">{selectedWordInfo.phonetic}</span>
              </div>
              <button 
                onClick={() => setSelectedWordInfo(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 min-w-[36px] min-h-[36px] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Định nghĩa</span>
              <p className="text-xs md:text-sm text-slate-800 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                {selectedWordInfo.definition}
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Ví dụ thực tế</span>
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                "{selectedWordInfo.example}"
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => setSelectedWordInfo(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all min-h-[40px]"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  handleSaveWord({ ...selectedWordInfo, category: recording.category });
                  setSelectedWordInfo(null);
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 min-h-[40px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm vào Từ điển</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AUDIO PLAYER CONTROLLER: Highly responsive and compact */}
      <footer className="fixed bottom-0 left-0 right-0 h-28 md:h-24 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-4 md:px-8 flex flex-col justify-center gap-2 z-40 shadow-xl transition-all">
        
        {/* Timeline progress container */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-10 text-right">
            {formatTime(currentTime)}
          </span>
          
          <div className="flex-1 relative py-2 cursor-pointer group">
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-100" 
                style={{ width: `${(currentTime / recording.durationSec) * 100}%` }}
              />
            </div>
            {/* Range input layer for scrubbing smoothly */}
            <input 
              type="range"
              min="0"
              max={recording.durationSec || 1}
              value={currentTime}
              onChange={(e) => {
                const t = Number(e.target.value);
                setCurrentTime(t);
                if (audioRef.current) audioRef.current.currentTime = t;
              }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-10">
            {recording.duration}
          </span>
        </div>

        {/* Player controls row */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Speed switcher (Optimized with multiple speeds for English Learners) */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSpeed(prev => prev === 0.75 ? 1.0 : prev === 1.0 ? 1.25 : prev === 1.25 ? 1.5 : prev === 1.5 ? 2.0 : prev === 2.0 ? 0.5 : 0.75)}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 min-h-[34px]"
              title="Điều chỉnh tốc độ nghe ngoại ngữ"
            >
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>{speed}x</span>
            </button>

            {/* Quick volume */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-14 h-1 accent-blue-600 bg-slate-200 rounded-full outline-none"
              />
            </div>
          </div>

          {/* Primary playback control cluster */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const t = Math.max(0, currentTime - 10);
                setCurrentTime(t);
                if (audioRef.current) audioRef.current.currentTime = t;
              }}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Lùi 10 giây"
            >
              <RotateCcw className="w-4.5 h-4.5" />
            </button>

            <button
              onClick={togglePlay}
              disabled={!!audioError && !audioReady}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-transform active:scale-95 shadow-md disabled:opacity-40"
              title={audioError || (isPlaying ? "Tạm dừng" : "Phát")}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current translate-x-[1px]" />
              )}
            </button>

            <button 
              onClick={() => {
                const t = Math.min(recording.durationSec, currentTime + 10);
                setCurrentTime(t);
                if (audioRef.current) audioRef.current.currentTime = t;
              }}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Tiến 10 giây"
            >
              <RotateCw className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Right utility buttons: Compact on mobile */}
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center" title="Đánh dấu học tập">
              <Bookmark className="w-4.5 h-4.5" />
            </button>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center" title="Thêm nữa">
              <MoreVertical className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>

      </footer>

    </div>
  );
}
