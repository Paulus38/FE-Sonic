import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  Settings, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  User, 
  Trash2, 
  Play,
  ChevronDown,
  MoreVertical,
  CheckCircle2,
  BookOpen,
  Filter,
  Languages,
  Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Recording, UserSettings } from '../types';

interface LibraryViewProps {
  recordings: Recording[];
  settings: UserSettings;
  onSelectRecording: (rec: Recording) => void;
  onPlay: (rec: Recording) => void;
  onDelete: (id: string) => void;
  onStartNewRecording: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function LibraryView({
  recordings,
  settings,
  onSelectRecording,
  onPlay,
  onDelete,
  onStartNewRecording,
  setCurrentTab
}: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'Tất cả' | 'Cuộc họp' | 'Phỏng vấn' | 'Học Tiếng Anh'>('Tất cả');
  const [sortBy, setSortBy] = useState<'mới nhất' | 'cũ nhất'>('mới nhất');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Filter and Search logic
  const filteredRecordings = recordings.filter(rec => {
    const matchesSearch =
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.summary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rec.tags || []).some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    
    const matchesFilter = activeFilter === 'Tất cả' ? true : rec.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  // Sort logic
  const sortedRecordings = [...filteredRecordings].sort((a, b) => {
    // Treat dates as fallback, but let's compare id/date
    if (sortBy === 'mới nhất') {
      return b.id.localeCompare(a.id);
    } else {
      return a.id.localeCompare(b.id);
    }
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Header Bar: Mobile responsive adjustments */}
      <header className="h-16 px-4 md:px-8 flex justify-between items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm z-10 transition-colors">
        <div className="flex items-center gap-4">
          <h2 className="text-lg md:text-xl font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <span className="md:hidden w-8 h-8 bg-indigo-950 dark:bg-indigo-900 text-white rounded-lg flex items-center justify-center">
              <Mic className="w-4 h-4 text-sky-400 fill-sky-400" />
            </span>
            <span>Thư viện</span>
          </h2>
          <nav className="hidden md:flex gap-6 items-center">
            <button className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">Tất cả</button>
            <button onClick={() => setCurrentTab('translations')} className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Dịch thuật</button>
            <button onClick={() => setCurrentTab('dictionary')} className="text-sm font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">Từ điển Anh-Việt</button>
          </nav>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Desktop search & Expandable Mobile search */}
          <div className="relative">
            <div className="hidden sm:block relative">
              <Search className="w-4.5 h-4.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input 
                type="text" 
                placeholder="Tìm bản ghi, thẻ, từ vựng..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full w-56 md:w-64 text-sm focus:ring-2 focus:ring-blue-600 dark:text-white transition-all outline-none"
              />
            </div>
            
            {/* Mobile search toggle button */}
            <button 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="sm:hidden p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Search className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-0.5">
            <button 
              onClick={() => setCurrentTab('settings')}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 min-w-[40px] min-h-[40px] flex items-center justify-center"
              title="Cài đặt"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={onStartNewRecording}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-semibold hover:shadow-md transition-all flex items-center gap-1.5 min-h-[40px]"
          >
            <Plus className="w-4 h-4 md:w-4.5 md:h-4.5" />
            <span className="hidden xs:inline">Ghi âm mới</span>
            <span className="xs:hidden">Ghi</span>
          </button>
        </div>
      </header>

      {/* Mobile Search Overlay Input */}
      <AnimatePresence>
        {isMobileSearchOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="sm:hidden px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                autoFocus
                placeholder="Nhập tên bản ghi, tóm tắt, từ khóa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-sm rounded-lg outline-none"
              />
            </div>
            <button 
              onClick={() => { setSearchQuery(''); setIsMobileSearchOpen(false); }}
              className="text-xs text-blue-600 dark:text-blue-400 font-bold p-1"
            >
              Hủy
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 md:pb-8">
        
        {/* Helper Tip for usage context */}
        <div className="mb-6 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-200/40 dark:border-blue-900/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span className="text-blue-600 dark:text-blue-400">✨</span>
              <span>Đồng hành cùng bạn học Tiếng Anh, phỏng vấn & họp khách hàng</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Ghi âm cuộc họp hoặc buổi học của bạn. Sonic Scribe sẽ tự động tạo bản dịch song ngữ Anh-Việt, tóm tắt ý chính và đề xuất từ vựng quan trọng giúp bạn nâng cao năng lực tiếng Anh mỗi ngày!
            </p>
          </div>
          <button 
            onClick={() => setCurrentTab('dictionary')}
            className="self-start md:self-auto shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 bg-white/60 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Mở Từ điển học tập</span>
          </button>
        </div>

        {/* Filters and Sorting: Responsive Carousel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 w-full overflow-hidden">
          {/* Scrollable Filters container on mobile - Guaranteed no-overflow */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full sm:w-auto max-w-full shrink-0">
            {(['Tất cả', 'Cuộc họp', 'Phỏng vấn', 'Học Tiếng Anh'] as const).map(filter => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 min-h-[36px] flex items-center justify-center ${
                  activeFilter === filter 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-slate-400">
              <Filter className="w-3 h-3" />
              <span>{sortedRecordings.length} bản ghi</span>
            </span>
            
            <button 
              onClick={() => setSortBy(sortBy === 'mới nhất' ? 'cũ nhất' : 'mới nhất')}
              className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg min-h-[36px]"
            >
              <span>{sortBy === 'mới nhất' ? 'Mới nhất' : 'Cũ nhất'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Recording Cards Grid */}
        {sortedRecordings.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-8">
            <Search className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Không tìm thấy bản ghi nào</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              Hãy thử tìm kiếm với từ khóa khác hoặc ghi âm một cuộc hội thoại mới ngay hôm nay!
            </p>
            <button 
              onClick={onStartNewRecording}
              className="mt-4 inline-flex items-center gap-1.5 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Bắt đầu Ghi âm mới</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {sortedRecordings.map((rec, index) => (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 md:p-5 hover:shadow-lg dark:hover:shadow-blue-900/5 hover:border-slate-300 dark:hover:border-slate-700/80 transition-all flex flex-col min-h-[260px] relative overflow-hidden group"
              >
                {/* Card Category Header */}
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 ${
                    rec.category === 'Cuộc họp'
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400'
                      : rec.category === 'Phỏng vấn'
                      ? 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400'
                      : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {rec.category === 'Cuộc họp' ? (
                      <Users className="w-3.5 h-3.5" />
                    ) : rec.category === 'Phỏng vấn' ? (
                      <User className="w-3.5 h-3.5" />
                    ) : (
                      <Languages className="w-3.5 h-3.5" />
                    )}
                    <span>{rec.category}</span>
                  </span>
                  
                  {/* Delete Button always accessible directly */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(rec.id); }}
                    className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg min-w-[36px] min-h-[36px] flex items-center justify-center"
                    title="Xóa bản ghi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Title */}
                <h3 
                  onClick={() => onSelectRecording(rec)}
                  className="font-bold text-base md:text-md text-slate-950 dark:text-white mb-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer line-clamp-1 leading-snug"
                >
                  {rec.title}
                </h3>

                {/* Metadata row */}
                <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 font-bold mb-3.5 shrink-0">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rec.date}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{rec.duration}</span>
                  </span>
                </div>

                {/* Summary text snippet */}
                <p className="text-slate-600 dark:text-slate-400 text-xs md:text-sm mb-4 line-clamp-3 leading-relaxed opacity-90 flex-1">
                  {rec.summary}
                </p>

                {/* Tags preview */}
                {rec.tags && rec.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3.5">
                    {rec.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-md font-medium">
                        #{tag}
                      </span>
                    ))}
                    {rec.tags.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-bold ml-1">+{rec.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Card Bottom Panel */}
                <div className="mt-auto pt-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 shrink-0">
                  {/* Avatars */}
                  <div className="flex -space-x-1.5 items-center">
                    {rec.participants && rec.participants.slice(0, 3).map((p, idx) => (
                      <img 
                        key={idx}
                        src={p.avatar} 
                        alt={p.name} 
                        title={`${p.name} (${p.role})`}
                        className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                      />
                    ))}
                    {rec.participants && rec.participants.length > 3 && (
                      <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-[9px] font-extrabold flex items-center justify-center text-slate-500">
                        +{rec.participants.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-2">
                    {rec.isTranslated && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px] font-bold mr-1" title="Bản dịch song ngữ sẵn sàng">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="hidden xs:inline">Song ngữ</span>
                      </span>
                    )}
                    
                    <button 
                      onClick={() => onSelectRecording(rec)}
                      className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[36px]"
                    >
                      Chi tiết
                    </button>

                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onPlay(rec);
                      }}
                      disabled={!rec.hasAudio}
                      className="flex items-center justify-center gap-1 bg-blue-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95 min-h-[36px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      <span>Phát</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Empty Slot card responsive */}
            <motion.div 
              onClick={onStartNewRecording}
              whileHover={{ scale: 1.01 }}
              className="border-2 border-dashed border-slate-300 hover:border-blue-600 dark:border-slate-800 dark:hover:border-blue-500 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-500 transition-all cursor-pointer bg-white/40 dark:bg-slate-900/40 min-h-[260px]"
            >
              <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center mb-3">
                <Plus className="w-6 h-6" />
              </div>
              <p className="text-xs font-extrabold uppercase tracking-widest">Ghi âm cuộc hội thoại</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 text-center max-w-[200px]">
                Học Tiếng Anh, ghi âm phỏng vấn hoặc cuộc họp khách hàng
              </p>
            </motion.div>

          </div>
        )}

      </div>

    </div>
  );
}
