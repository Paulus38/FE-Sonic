import React from 'react';
import { 
  LayoutDashboard, 
  Mic, 
  Languages, 
  BookOpen, 
  BarChart3, 
  Cloud, 
  HelpCircle, 
  User, 
  Settings,
  Zap,
  Shield,
  ScrollText,
} from 'lucide-react';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatTokens(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  storageUsedBytes?: number;
  storageQuotaBytes?: number;
  storageLoading?: boolean;
  aiUsedTokens?: number;
  aiQuotaTokens?: number;
  aiUsageLoading?: boolean;
  isAdmin?: boolean;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  storageUsedBytes = 0,
  storageQuotaBytes = 1024 * 1024 * 1024,
  storageLoading = false,
  aiUsedTokens = 0,
  aiQuotaTokens = 1_500_000,
  aiUsageLoading = false,
  isAdmin = false,
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', labelEng: 'Dashboard', icon: LayoutDashboard },
    { id: 'recordings', label: 'Bản ghi', labelEng: 'Recordings', icon: Mic },
    { id: 'translations', label: 'Dịch thuật', labelEng: 'Translations', icon: Languages },
    { id: 'dictionary', label: 'Từ điển', labelEng: 'Dictionary', icon: BookOpen },
    { id: 'ai_usage', label: 'AI Tokens', labelEng: 'Usage', icon: Zap },
    { id: 'analytics', label: 'Phân tích', labelEng: 'Analytics', icon: BarChart3 },
    ...(isAdmin
      ? [
          { id: 'admin', label: 'Quản trị', labelEng: 'RBAC', icon: Shield },
          {
            id: 'admin_logs',
            label: 'Nhật ký',
            labelEng: 'Audit',
            icon: ScrollText,
          },
        ]
      : []),
  ];

  const quota = storageQuotaBytes > 0 ? storageQuotaBytes : 1;
  const storagePercentage = Math.min(100, (storageUsedBytes / quota) * 100);
  const tokenQuota = aiQuotaTokens > 0 ? aiQuotaTokens : 1;
  const aiPercentage = Math.min(100, (aiUsedTokens / tokenQuota) * 100);

  // Navigation items optimized for mobile bottom bar (max 5 items)
  const mobileNavItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'recordings', label: 'Bản ghi', icon: Mic },
    { id: 'translations', label: 'Dịch', icon: Languages },
    { id: 'dictionary', label: 'Từ điển', icon: BookOpen },
    { id: 'settings', label: 'Cài đặt', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR: Hidden on Mobile */}
      <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 flex-col h-screen shrink-0 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-1">
          <div className="w-10 h-10 bg-indigo-950 dark:bg-indigo-900 text-white rounded-xl flex items-center justify-center shadow-sm">
            <Mic className="w-5 h-5 text-sky-400 fill-sky-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-950 dark:text-white leading-tight">Sonic Scribe</h1>
            <p className="text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400 font-extrabold">AI Translation</p>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-blue-600 dark:bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <div className="flex flex-col">
                  <span className="leading-tight">{item.label}</span>
                  <span className={`text-[10px] font-medium ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>{item.labelEng}</span>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Footer Utility Section */}
        <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {/* Storage Panel */}
          <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3.5 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Dung lượng lưu trữ</p>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-300" 
                  style={{ width: `${storagePercentage}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {storageLoading
                  ? 'Đang đo cloud...'
                  : `${formatBytes(storageUsedBytes)} / ${formatBytes(storageQuotaBytes)} (${Math.round(storagePercentage)}%)`}
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
              <Cloud className="w-20 h-20 text-slate-900 dark:text-white" />
            </div>
          </div>

          {/* AI Token Panel */}
          <button
            type="button"
            onClick={() => setCurrentTab('ai_usage')}
            className="w-full text-left bg-slate-100 dark:bg-slate-800/80 rounded-xl p-3.5 relative overflow-hidden group hover:ring-1 hover:ring-violet-400/40 transition-all"
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Dung lượng token AI
              </p>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    aiPercentage >= 90
                      ? 'bg-rose-500'
                      : aiPercentage >= 70
                        ? 'bg-amber-500'
                        : 'bg-violet-600 dark:bg-violet-500'
                  }`}
                  style={{ width: `${aiPercentage}%` }}
                />
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {aiUsageLoading
                  ? 'Đang đo tokens...'
                  : `${formatTokens(aiUsedTokens)} / ${formatTokens(aiQuotaTokens)} (${Math.round(aiPercentage)}%)`}
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
              <Zap className="w-20 h-20 text-slate-900 dark:text-white" />
            </div>
          </button>

          {/* Support & Profile */}
          <div className="space-y-1">
            <button
              onClick={() => setCurrentTab('help')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-left ${
                currentTab === 'help'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
              }`}
            >
              <HelpCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span>Hỗ trợ (Help)</span>
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 text-left ${
                currentTab === 'settings'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/80'
              }`}
            >
              <User className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              <span>Hồ sơ & Cài đặt</span>
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE BOTTOM NAV — ẩn khi đang ghi âm để không che nút điều khiển */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-40 px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe transition-colors ${
        currentTab === 'recording_live' || currentTab === 'recording_detail'
          ? 'hidden'
          : ''
      }`}>
        {mobileNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id || (item.id === 'recordings' && (currentTab === 'recording_detail' || currentTab === 'recording_live'));
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] min-h-[48px] rounded-xl px-2 py-1 transition-colors ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <IconComponent className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
