import React, { useEffect, useState } from 'react';
import {
  Bell,
  Settings,
  Languages,
  Sliders,
  Sun,
  Moon,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Camera,
  Loader2,
} from 'lucide-react';
import { UserSettings } from '../types';

const PRIMARY_LANGS = [
  'Tiếng Việt',
  'Tiếng Anh (US)',
  'Tiếng Anh (UK)',
  'Tiếng Nhật',
  'Tiếng Hàn',
  'Tiếng Trung',
];

const SECONDARY_LANGS = [
  'Tiếng Anh (US)',
  'Tiếng Anh (UK)',
  'Tiếng Việt',
  'Tiếng Nhật',
  'Tiếng Hàn',
  'Tiếng Trung',
];

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void | Promise<void>;
  setCurrentTab: (tab: string) => void;
  onLogout?: () => void;
}

export default function SettingsView({
  settings,
  onUpdateSettings,
  setCurrentTab,
  onLogout,
}: SettingsViewProps) {
  const [name, setName] = useState(settings.name);
  const [avatar, setAvatar] = useState(settings.avatar || '');
  const [sampleRate, setSampleRate] = useState(settings.sampleRate);
  const [noiseReduction, setNoiseReduction] = useState(
    settings.aiNoiseCancellation,
  );
  const [primaryLang, setPrimaryLang] = useState(settings.primaryLang);
  const [secondaryLang, setSecondaryLang] = useState(settings.secondaryLang);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [editingAvatar, setEditingAvatar] = useState(false);

  useEffect(() => {
    setName(settings.name);
    setAvatar(settings.avatar || '');
    setSampleRate(settings.sampleRate);
    setNoiseReduction(settings.aiNoiseCancellation);
    setPrimaryLang(settings.primaryLang);
    setSecondaryLang(settings.secondaryLang);
  }, [settings]);

  useEffect(() => {
    if (!saveMessage) return;
    const t = setTimeout(() => setSaveMessage(null), 2800);
    return () => clearTimeout(t);
  }, [saveMessage]);

  const hasChanges =
    name.trim() !== settings.name ||
    (avatar || '') !== (settings.avatar || '') ||
    sampleRate !== settings.sampleRate ||
    noiseReduction !== settings.aiNoiseCancellation ||
    primaryLang !== settings.primaryLang ||
    secondaryLang !== settings.secondaryLang;

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      setSaveMessage({ type: 'error', text: 'Họ tên không được để trống.' });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      await onUpdateSettings({
        ...settings,
        name: name.trim(),
        avatar: avatar.trim(),
        sampleRate,
        aiNoiseCancellation: noiseReduction,
        primaryLang,
        secondaryLang,
      });
      setEditingAvatar(false);
      setSaveMessage({
        type: 'success',
        text: 'Đã cập nhật thông tin cài đặt.',
      });
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Không lưu được cài đặt. Thử lại.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = async (newTheme: 'light' | 'dark') => {
    try {
      await onUpdateSettings({
        ...settings,
        theme: newTheme,
      });
    } catch {
      setSaveMessage({ type: 'error', text: 'Không đổi được giao diện.' });
    }
  };

  return (
    <div className="flex-1 ml-0 flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="flex justify-between items-center w-full px-8 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 shadow-sm transition-colors">
        <h2 className="text-lg font-bold text-slate-950 dark:text-white">
          Cài đặt hệ thống
        </h2>
        <div className="flex items-center gap-6">
          <div className="flex gap-4 items-center">
            <button
              type="button"
              className="text-slate-500 hover:text-slate-900 dark:hover:text-white p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell className="w-5 h-5" />
            </button>
            <button
              type="button"
              className="text-slate-900 dark:text-white p-1 rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-3">
            <img
              src={avatar || settings.avatar || ''}
              alt={name || settings.name}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 object-cover bg-slate-200"
            />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-10 py-8 pb-28">
        <div className="max-w-5xl mx-auto space-y-8">
          {saveMessage && (
            <div
              className={`rounded-xl px-4 py-3 text-xs font-bold border ${
                saveMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900'
              }`}
            >
              {saveMessage.text}
            </div>
          )}

          <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col md:flex-row gap-6 items-start transition-colors">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center bg-blue-100 dark:bg-slate-800 shadow-inner">
                {(avatar || settings.avatar) ? (
                  <img
                    src={avatar || settings.avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-black text-blue-600">
                    {(name || '?').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingAvatar((v) => !v)}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-md border-2 border-white dark:border-slate-900 hover:scale-110 transition-all cursor-pointer"
                title="Đổi ảnh đại diện"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 space-y-5 w-full">
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white mb-1">
                  Thông tin cá nhân
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Chỉnh sửa tên, ảnh và thông tin hiển thị trên hệ thống.
                </p>
              </div>

              {editingAvatar && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    URL ảnh đại diện
                  </label>
                  <input
                    type="url"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-600 dark:text-white outline-none transition-colors"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-600 dark:text-white outline-none transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                    Địa chỉ Email
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    readOnly
                    title="Email không thể đổi tại đây"
                    className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400">
                    Email dùng để đăng nhập — không chỉnh sửa tại đây.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleSaveChanges()}
                disabled={saving || !hasChanges}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all inline-flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
              <div className="flex items-center gap-2.5">
                <Languages className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  Ngôn ngữ bản dịch
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Ngôn ngữ chính
                  </label>
                  <select
                    value={primaryLang}
                    onChange={(e) => setPrimaryLang(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-600 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    {!PRIMARY_LANGS.includes(primaryLang) && (
                      <option value={primaryLang}>{primaryLang}</option>
                    )}
                    {PRIMARY_LANGS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                    Ngôn ngữ phụ (dịch)
                  </label>
                  <select
                    value={secondaryLang}
                    onChange={(e) => setSecondaryLang(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm font-semibold focus:ring-2 focus:ring-blue-600 dark:text-white outline-none appearance-none cursor-pointer"
                  >
                    {!SECONDARY_LANGS.includes(secondaryLang) && (
                      <option value={secondaryLang}>{secondaryLang}</option>
                    )}
                    {SECONDARY_LANGS.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-400">
                  Nhấn &quot;Lưu thay đổi&quot; ở trên để áp dụng ngôn ngữ mới.
                </p>
              </div>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-6 transition-colors">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  Chất lượng âm thanh
                </h3>
              </div>

              <div className="space-y-6">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                      Tỷ lệ lấy mẫu (Sample Rate)
                    </p>
                    <p className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {sampleRate} kHz
                    </p>
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

                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200/50 dark:border-slate-800/60">
                  <div>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Chống nhiễu AI
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Giảm tiếng ồn nền khi ghi âm
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNoiseReduction(!noiseReduction)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${
                      noiseReduction
                        ? 'bg-blue-600'
                        : 'bg-slate-300 dark:bg-slate-800'
                    }`}
                    aria-pressed={noiseReduction}
                  >
                    <div
                      className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                        noiseReduction ? 'translate-x-[22px]' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm flex flex-col justify-between transition-colors">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  Giao diện
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Chọn chế độ hiển thị phù hợp.
                </p>
              </div>

              <div className="mt-6 flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => void handleThemeChange('light')}
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
                  type="button"
                  onClick={() => void handleThemeChange('dark')}
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

            <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800/80 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-slate-950 dark:text-white">
                    Bảo mật tài khoản
                  </h3>
                </div>
                {settings.role === 'admin' && (
                  <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/20 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-widest">
                    Admin
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4.5 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white leading-tight">
                      Mật khẩu
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                      Liên hệ admin nếu cần đặt lại mật khẩu
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4.5 p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-950 dark:text-white leading-tight">
                      Vai trò
                    </p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1 capitalize">
                      {settings.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {onLogout && (
            <section className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Đăng xuất</h3>
                <p className="text-xs text-slate-500">
                  Thoát phiên làm việc hiện tại trên thiết bị này.
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="px-5 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Đăng xuất
              </button>
            </section>
          )}

          <section className="bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl p-6 border border-rose-200 dark:border-rose-900/30 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 mb-0.5">
                  Vùng nguy hiểm
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Xóa vĩnh viễn tài khoản và tất cả dữ liệu ghi âm của bạn.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCurrentTab('help')}
              className="bg-rose-600/80 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              Liên hệ hỗ trợ
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
