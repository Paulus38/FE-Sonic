import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Volume2, 
  Filter,
  Check,
  Award,
  Tag,
  Briefcase,
  HelpCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DictionaryItem } from '../types';

interface DictionaryViewProps {
  dictionaryItems: DictionaryItem[];
  onAddWord: (item: Omit<DictionaryItem, 'id'>) => void;
  onDeleteWord: (id: string) => void;
  onImportDuolingo: (payload: {
    jwtToken: string;
    learningLanguage?: string;
    nativeLanguage?: string;
    limit?: number;
  }) => Promise<{ totalReceived: number; imported: number; skipped: number }>;
}

export default function DictionaryView({ 
  dictionaryItems, 
  onAddWord, 
  onDeleteWord,
  onImportDuolingo,
}: DictionaryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Tất cả' | 'Học Tiếng Anh' | 'Phỏng vấn' | 'Họp Khách hàng'>('Tất cả');
  
  // State for Add Word Form/Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');
  const [newDefinition, setNewDefinition] = useState('');
  const [newExample, setNewExample] = useState('');
  const [newCategory, setNewCategory] = useState<'Học Tiếng Anh' | 'Phỏng vấn' | 'Họp Khách hàng'>('Học Tiếng Anh');
  const [duolingoToken, setDuolingoToken] = useState('');
  const [duolingoLimit, setDuolingoLimit] = useState(100);
  const [importingDuolingo, setImportingDuolingo] = useState(false);

  const filteredItems = dictionaryItems.filter(item => {
    const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.example.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'Tất cả' ? true : item.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSpeak = (word: string) => {
    // Standard Speech Synthesis API inside iframe (fallback to console if blocked)
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // Slightly slower for better learning
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Speech Synthesis API not supported or blocked in this iframe context.");
    }

    // Interactive Toast feedback
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-indigo-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50';
    toast.innerText = `🔊 Phát âm từ: "${word}"`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim() || !newDefinition.trim()) return;

    onAddWord({
      word: newWord.trim(),
      phonetic: newPhonetic.trim() || undefined,
      definition: newDefinition.trim(),
      example: newExample.trim(),
      category: newCategory
    });

    // Reset Form
    setNewWord('');
    setNewPhonetic('');
    setNewDefinition('');
    setNewExample('');
    setNewCategory('Học Tiếng Anh');
    setIsAddModalOpen(false);

    // Show feedback banner
    const banner = document.createElement('div');
    banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50';
    banner.innerText = '✓ Đã thêm từ mới vào từ điển của bạn!';
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2000);
  };

  const handleImportDuolingo = async () => {
    if (!duolingoToken.trim()) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50';
      toast.innerText = 'Cần nhập Duolingo JWT token.';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2200);
      return;
    }

    setImportingDuolingo(true);
    try {
      const result = await onImportDuolingo({
        jwtToken: duolingoToken.trim(),
        learningLanguage: 'en',
        nativeLanguage: 'vi',
        limit: duolingoLimit,
      });
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50';
      toast.innerText = `Import Duolingo: +${result.imported} từ, bỏ qua ${result.skipped}.`;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2600);
    } catch (err) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg z-50';
      toast.innerText = err instanceof Error ? err.message : 'Import Duolingo thất bại';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2600);
    } finally {
      setImportingDuolingo(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header Bar */}
      <header className="h-16 px-4 md:px-8 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-950 dark:bg-indigo-900 text-white rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-extrabold text-slate-950 dark:text-white leading-tight">Từ điển của tôi</h2>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Học tập & chuẩn bị công việc</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-4 py-2 rounded-full text-xs md:text-sm font-semibold hover:shadow-md transition-all flex items-center gap-1.5 min-h-[38px]"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm từ mới</span>
        </button>
      </header>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        
        {/* Statistics & Motivation Banner */}
        <div className="mb-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-5 md:p-6 relative overflow-hidden shadow-md">
          <div className="relative z-10 space-y-2 max-w-lg">
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest border border-blue-500/30">
              Sổ tay từ vựng thông minh
            </span>
            <h3 className="text-base md:text-lg font-extrabold text-white">Xây dựng vốn từ vựng chuyên ngành</h3>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Chuẩn bị tốt nhất cho các buổi phỏng vấn xin việc và các cuộc họp trực tiếp với khách hàng nước ngoài bằng cách lưu trữ, tra cứu âm thanh và luyện tập các cụm từ đắt giá hàng ngày.
            </p>
            <div className="flex gap-4 pt-2 text-[11px] font-bold text-slate-200">
              <span className="flex items-center gap-1">
                <Check className="w-4.5 h-4.5 text-emerald-400" />
                <span>{dictionaryItems.length} Từ vựng tích lũy</span>
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                <span>Mục tiêu: Đạt 100 từ vựng cốt lõi</span>
              </span>
            </div>
          </div>
          <div className="absolute right-4 bottom-0 opacity-10 hidden sm:block">
            <BookOpen className="w-44 h-44 text-white" />
          </div>
        </div>

        <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Import từ vựng từ Duolingo
            </h4>
            <span className="text-[10px] text-slate-500 font-bold uppercase">
              unofficial
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Dán JWT token lấy từ cookie phiên đăng nhập Duolingo để pull word list về tài khoản của bạn.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_110px_140px] gap-2.5">
            <input
              type="password"
              value={duolingoToken}
              onChange={(e) => setDuolingoToken(e.target.value)}
              placeholder="Duolingo JWT token"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs md:text-sm outline-none"
            />
            <input
              type="number"
              min={1}
              max={500}
              value={duolingoLimit}
              onChange={(e) => setDuolingoLimit(Number(e.target.value) || 100)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none"
            />
            <button
              onClick={() => void handleImportDuolingo()}
              disabled={importingDuolingo}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 disabled:opacity-60"
            >
              {importingDuolingo ? 'Đang import...' : 'Import Duolingo'}
            </button>
          </div>
        </div>

        {/* Filters and Search Bar: Adaptive layout */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full overflow-hidden">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm từ vựng, định nghĩa hoặc câu ví dụ..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 dark:text-white outline-none shadow-xs transition-all"
              />
            </div>

            {/* Sorting Categories select on mobile or tabs on desktop */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
              {(['Tất cả', 'Học Tiếng Anh', 'Phỏng vấn', 'Họp Khách hàng'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 transition-all min-h-[38px] ${
                    activeFilter === filter
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dictionary Grid */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Từ điển chưa có từ vựng nào</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Hãy nhập từ vựng thủ công bằng nút phía trên hoặc nhấp vào các từ gạch chân khi xem bản ghi chi tiết để lưu trữ nhanh nhé!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredItems.map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, delay: Math.min(index * 0.04, 0.2) }}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 hover:shadow-md transition-all flex flex-col justify-between min-h-[170px] relative overflow-hidden group"
                >
                  <div className="space-y-2.5">
                    
                    {/* Word row */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-base md:text-md text-indigo-950 dark:text-white tracking-tight flex items-center gap-1.5">
                          <span>{item.word}</span>
                          <button 
                            onClick={() => handleSpeak(item.word)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
                            title="Nghe phát âm chuẩn giọng Mỹ"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        </h4>
                        {item.phonetic && (
                          <span className="text-[11px] font-mono font-bold text-slate-400 dark:text-slate-500 block">
                            {item.phonetic}
                          </span>
                        )}
                      </div>

                      {/* Tag category */}
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${
                        item.category === 'Học Tiếng Anh'
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : item.category === 'Phỏng vấn'
                          ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                          : 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      }`}>
                        {item.category}
                      </span>
                    </div>

                    {/* Definition */}
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800/60">
                      {item.definition}
                    </p>

                    {/* Sample Example */}
                    {item.example && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic leading-relaxed">
                        <strong>Ví dụ:</strong> "{item.example}"
                      </div>
                    )}
                  </div>

                  {/* Card Actions Panel */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span>Sổ tay lưu trữ</span>
                    </span>
                    
                    <button 
                      onClick={() => onDeleteWord(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                      title="Xóa từ vựng này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>

      {/* ADD NEW WORD DIALOG / MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
            >
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex justify-between items-center">
                <h3 className="font-extrabold text-sm md:text-base text-indigo-950 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4.5 h-4.5 text-blue-500" />
                  <span>Thêm Từ vựng & Cụm từ mới</span>
                </h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1.5"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Từ vựng / Cụm từ *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ví dụ: Synergy, Deliverable..."
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Phiên âm (Phonetic)</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: /ˈsɪn.ə.dʒi/"
                      value={newPhonetic}
                      onChange={(e) => setNewPhonetic(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Chủ đề phân loại</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="Học Tiếng Anh">Học Tiếng Anh</option>
                      <option value="Phỏng vấn">Phỏng vấn</option>
                      <option value="Họp Khách hàng">Họp Khách hàng</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Định nghĩa chi tiết *</label>
                  <textarea 
                    required
                    rows={2}
                    placeholder="Nhập nghĩa Tiếng Việt hoặc lưu ý ngữ pháp..."
                    value={newDefinition}
                    onChange={(e) => setNewDefinition(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Câu ví dụ thực tế</label>
                  <textarea 
                    rows={2}
                    placeholder="Nhập ví dụ đặt câu bằng Tiếng Anh để dễ ghi nhớ..."
                    value={newExample}
                    onChange={(e) => setNewExample(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-600 outline-none font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 transition-all min-h-[42px]"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all min-h-[42px]"
                  >
                    Lưu từ vựng
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
