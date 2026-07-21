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
  Sparkles,
  Settings
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  storageUsed?: number; // GB
  storageTotal?: number; // GB
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  storageUsed = 7.5, 
  storageTotal = 10 
}: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Tổng quan', labelEng: 'Dashboard', icon: LayoutDashboard },
    { id: 'recordings', label: 'Bản ghi', labelEng: 'Recordings', icon: Mic },
    { id: 'translations', label: 'Dịch thuật', labelEng: 'Translations', icon: Languages },
    { id: 'dictionary', label: 'Từ điển', labelEng: 'Dictionary', icon: BookOpen },
    { id: 'analytics', label: 'Phân tích', labelEng: 'Analytics', icon: BarChart3 },
  ];

  const storagePercentage = (storageUsed / storageTotal) * 100;

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
                {storageUsed}GB / {storageTotal}GB ({Math.round(storagePercentage)}%)
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-300">
              <Cloud className="w-20 h-20 text-slate-900 dark:text-white" />
            </div>
          </div>

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
              <span>Tài khoản (Account)</span>
            </button>
          </div>

          {/* Upgrade to Pro Button */}
          {currentTab !== 'settings' && (
            <button 
              onClick={() => setCurrentTab('settings')}
              className="w-full bg-slate-950 hover:bg-slate-900 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-bounce" />
              <span>Nâng cấp Pro</span>
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE BOTTOM NAVIGATION BAR: Visible only on Mobile (<md) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center justify-around z-40 px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe transition-colors">
        {mobileNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id || (item.id === 'recordings' && currentTab === 'recording_detail') || (item.id === 'recordings' && currentTab === 'recording_live');
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 h-full transition-all duration-200 ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 font-semibold'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-blue-50 dark:bg-blue-950/40' : ''}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
