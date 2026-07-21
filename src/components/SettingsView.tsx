import React, { useState } from 'react';
import { 
  Bell, 
  Settings, 
  User, 
  Mail, 
  Languages, 
  Volume2, 
  Sliders, 
  Sun, 
  Moon, 
  Lock, 
  ShieldCheck,
  AlertTriangle,
  Camera,
  ChevronDown
} from 'lucide-react';
import { UserSettings } from '../types';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
  setCurrentTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function SettingsView({ settings, onUpdateSettings, setCurrentTab, onLogout }: SettingsViewProps) {
  const [name, setName] = useState(settings.name);
  const [email, setEmail] = useState(settings.email);
  const [sampleRate, setSampleRate] = useState(settings.sampleRate);
  const [noiseReduction, setNoiseReduction] = useState(settings.aiNoiseCancellation);
  const [primaryLang, setPrimaryLang] = useState(settings.primaryLang);
  const [secondaryLang, setSecondaryLang] = useState(settings.secondaryLang);

  const handleSaveChanges = () => {
    onUpdateSettings({
      ...settings,
      name,
      email,
      sampleRate,
      aiNoiseCancellation: noiseReduction,
      primaryLang,
      secondaryLang
    });
    alert("Đã cập nhật thông tin cài đặt thành công!");
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    onUpdateSettings({
      ...settings,
      theme: newTheme
    });
  };

  return (
    <div className="flex-1 ml-0 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* TopAppBar */}
      <header className="flex justify-between items-center w-full px-8 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm transition-colors">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">Cài đặt hệ thống</h2>
        <div className="flex items-center gap-6">
          <div className="flex gap-4 items-center">
            <button className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="w-5 h-5" />
            </button>
            <button className="text-slate-900 dark:text-white p-1 rounded-full bg-slate-100 dark:bg-slate-800">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-3">
            <img src={settings.avatar} alt={settings.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover" />
          </div>
        </div>
      </header>

      {/* Scrollable Settings Workspace */}
      <div className="flex-1 overflow-y-auto px-10 py-8 pb-28">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Section: Profile Info (Thông tin cá nhân) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row gap-6 items-start transition-colors">
            {/* Avatar Circle with edit pen */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center bg-blue-100 dark:bg-slate-800 shadow-inner">
                <img src={settings.avatar} alt={settings.name} className="w-full h-full object-cover" />
              </div>
              <button className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-slate-900 hover:scale-110 transition-all cursor-pointer">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Profile inputs */}
            <div className="flex-1 space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1">Thông tin cá nhân</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quản lý danh tính và thông tin liên hệ của bạn.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Họ và tên</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-600 dark:text-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Địa chỉ Email</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-600 dark:text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={handleSaveChanges}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                Lưu thay đổi
              </button>
            </div>
          </section>

          {/* Dual Grid Layout for Languages and Quality */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Section: Ngôn ngữ bản dịch */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
              <div className="flex items-center gap-2.5">
                <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Ngôn ngữ bản dịch</h3>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ngôn ngữ chính</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{primaryLang}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-800/60 flex justify-between items-center cursor-pointer">
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Ngôn ngữ phụ</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">{secondaryLang}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </section>

            {/* Section: Chất lượng âm thanh */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Chất lượng âm thanh</h3>
              </div>

              <div className="space-y-6">
                {/* Sample rate range slider */}
                <div className="space-y-3.5">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Tỷ lệ lấy mẫu (Sample Rate)</p>
                    <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">{sampleRate} kHz</p>
                  </div>

                  <input 
                    type="range" 
                    min="8" 
                    max="96" 
                    step="8"
                    value={sampleRate}
                    onChange={(e) => setSampleRate(Number(e.target.value))}
                    className="w-full cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none accent-blue-600"
                  />

                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>8 kHz</span>
                    <span>High Fidelity</span>
                    <span>96 kHz</span>
                  </div>
                </div>

                {/* Noise Cancellation Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Chống nhiễu AI</span>
                  
                  <button 
                    onClick={() => setNoiseReduction(!noiseReduction)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      noiseReduction ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                      noiseReduction ? 'translate-x-[22px]' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
              </div>
            </section>

          </div>

          {/* Dual Grid Layout 2 for Theme and Security */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Theme Toggle (Giao diện) */}
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-colors">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Giao diện</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chọn chế độ hiển thị phù hợp.</p>
              </div>

              <div className="mt-6 flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <button 
                  onClick={() => handleThemeChange('light')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.theme === 'light' 
                      ? 'bg-white text-slate-950 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Sáng</span>
                </button>
                <button 
                  onClick={() => handleThemeChange('dark')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    settings.theme === 'dark' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span>Tối</span>
                </button>
              </div>
            </section>

            {/* Account Security (Bảo mật tài khoản) */}
            <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">Bảo mật tài khoản</h3>
                </div>
                <span className="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/20 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                  Mức độ cao
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Password card */}
                <div className="flex items-center gap-4.5 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl hover:border-blue-600 dark:hover:border-blue-500 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white leading-tight">Mật khẩu</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Cập nhật lần cuối: 2 tháng trước</p>
                  </div>
                </div>

                {/* 2FA card */}
                <div className="flex items-center gap-4.5 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl hover:border-blue-600 dark:hover:border-blue-500 cursor-pointer transition-all">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white leading-tight">Xác thực 2 lớp</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">Đang kích hoạt</p>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* Logout */}
          {onLogout && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Đăng xuất</h3>
                <p className="text-xs text-slate-500">Thoát phiên làm việc hiện tại trên thiết bị này.</p>
              </div>
              <button
                onClick={onLogout}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Đăng xuất
              </button>
            </section>
          )}

          {/* Danger Zone: Vùng nguy hiểm */}
          <section className="bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/30 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-0.5">Vùng nguy hiểm</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Xóa vĩnh viễn tài khoản và tất cả dữ liệu ghi âm của bạn.</p>
              </div>
            </div>
            <button className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer">
              Xóa tài khoản
            </button>
          </section>

        </div>
      </div>

    </div>
  );
}
