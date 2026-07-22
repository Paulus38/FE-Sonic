import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import FloatingPlayer from './components/FloatingPlayer';
import LibraryView from './components/LibraryView';
import DetailView from './components/DetailView';
import LiveRecordView from './components/LiveRecordView';
import SettingsView from './components/SettingsView';
import DictionaryView from './components/DictionaryView';
import AuthView from './components/AuthView';
import AiUsageView from './components/AiUsageView';
import AdminUsersView from './components/AdminUsersView';
import DashboardView from './components/DashboardView';
import AnalyticsView from './components/AnalyticsView';
import { Recording, UserSettings, DictionaryItem } from './types';
import {
  dictionaryApi,
  recordingsApi,
  setToken,
  usersApi,
  aiApi,
} from './lib/api';
import {
  Languages,
  HelpCircle,
} from 'lucide-react';
import { useNotify } from './components/ui/Notify';

const emptySettings: UserSettings = {
  name: '',
  email: '',
  avatar: '',
  primaryLang: 'Tiếng Việt',
  secondaryLang: 'Tiếng Anh (US)',
  sampleRate: 48,
  aiNoiseCancellation: true,
  theme: 'light',
  role: 'user',
};

function mapMeToSettings(
  me: UserSettings & { id: string; role?: 'user' | 'admin' },
): UserSettings {
  return {
    name: me.name,
    email: me.email,
    avatar: me.avatar || '',
    primaryLang: me.primaryLang,
    secondaryLang: me.secondaryLang,
    sampleRate: me.sampleRate,
    aiNoiseCancellation: me.aiNoiseCancellation,
    theme: me.theme,
    role: me.role || 'user',
    id: me.id,
  };
}

function filterLibraryItems(items: Recording[]): Recording[] {
  return items.filter(
    (r) =>
      !r.status ||
      r.status === 'ready' ||
      r.status === 'processing' ||
      r.status === 'recording',
  );
}

function sortNewestFirst(items: Recording[]): Recording[] {
  return [...items].sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (tb !== ta) return tb - ta;
    return b.id.localeCompare(a.id);
  });
}

export default function App() {
  const { confirm } = useNotify();
  const [token, setTokenState] = useState<string | null>(
    () => localStorage.getItem('sonic_token'),
  );
  /** Only blocks shell while validating session (`/users/me`). */
  const [bootstrapping, setBootstrapping] = useState(!!token);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [recordingsLoaded, setRecordingsLoaded] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings>(emptySettings);
  const [dictionaryItems, setDictionaryItems] = useState<DictionaryItem[]>([]);
  const [dictionaryLoaded, setDictionaryLoaded] = useState(false);
  const [dictionaryLoading, setDictionaryLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('recordings');
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(
    null,
  );
  const [playingRecording, setPlayingRecording] = useState<Recording | null>(
    null,
  );
  const [loadError, setLoadError] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [storageUsedBytes, setStorageUsedBytes] = useState(0);
  const [storageQuotaBytes, setStorageQuotaBytes] = useState(1024 * 1024 * 1024);
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [aiUsedTokens, setAiUsedTokens] = useState(0);
  const [aiQuotaTokens, setAiQuotaTokens] = useState(1_500_000);
  const [aiUsageLoading, setAiUsageLoading] = useState(false);
  const [aiUsageLoaded, setAiUsageLoaded] = useState(false);

  const refreshStorage = useCallback(async (force = false) => {
    if (!force && storageLoaded) return;
    setStorageLoading(true);
    try {
      const usage = await usersApi.storage();
      setStorageUsedBytes(usage.usedBytes || 0);
      setStorageQuotaBytes(usage.quotaBytes || 1024 * 1024 * 1024);
      setStorageLoaded(true);
    } catch {
      // keep last known values
    } finally {
      setStorageLoading(false);
    }
  }, [storageLoaded]);

  const refreshAiUsage = useCallback(async (force = false) => {
    if (!force && aiUsageLoaded) return;
    setAiUsageLoading(true);
    try {
      const usage = await aiApi.usage();
      setAiUsedTokens(usage.usedTokens ?? usage.summary?.totalTokens ?? 0);
      setAiQuotaTokens(usage.quotaTokens || 1_500_000);
      setAiUsageLoaded(true);
    } catch {
      // keep last known values
    } finally {
      setAiUsageLoading(false);
    }
  }, [aiUsageLoaded]);

  const refreshRecordings = useCallback(async (force = false) => {
    if (!force && recordingsLoaded) return;
    setRecordingsLoading(true);
    setLoadError('');
    try {
      const recs = await recordingsApi.list(1, 100);
      setRecordings(sortNewestFirst(filterLibraryItems(recs.items)));
      setRecordingsLoaded(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Không tải được danh sách bản ghi',
      );
    } finally {
      setRecordingsLoading(false);
    }
  }, [recordingsLoaded]);

  const refreshDictionary = useCallback(async (force = false) => {
    if (!force && dictionaryLoaded) return;
    setDictionaryLoading(true);
    try {
      const dict = await dictionaryApi.list();
      setDictionaryItems(dict.items);
      setDictionaryLoaded(true);
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không tải được từ điển',
      });
    } finally {
      setDictionaryLoading(false);
    }
  }, [dictionaryLoaded]);

  // F5 / session restore: only validate user — never preload all screens.
  useEffect(() => {
    if (!token) {
      setBootstrapping(false);
      setRecordings([]);
      setRecordingsLoaded(false);
      setDictionaryItems([]);
      setDictionaryLoaded(false);
      setStorageLoaded(false);
      setAiUsageLoaded(false);
      return;
    }
    let cancelled = false;
    setBootstrapping(true);
    usersApi
      .me()
      .then((me) => {
        if (cancelled) return;
        setSettings(mapMeToSettings(me));
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof Error ? err.message : 'Phiên đăng nhập hết hạn',
        );
        setToken(null);
        setTokenState(null);
      })
      .finally(() => {
        if (!cancelled) setBootstrapping(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // Load data only when the active screen needs it.
  useEffect(() => {
    if (!token || bootstrapping) return;

    const needsRecordings =
      currentTab === 'recordings' ||
      currentTab === 'translations' ||
      currentTab === 'analytics' ||
      currentTab === 'dashboard';

    const needsDictionary =
      currentTab === 'dictionary' ||
      currentTab === 'analytics' ||
      currentTab === 'dashboard';

    if (needsRecordings) void refreshRecordings();
    if (needsDictionary) void refreshDictionary();

    // Sidebar meters — fetch once after session is ready, non-blocking.
    void refreshStorage();
    void refreshAiUsage();
  }, [
    token,
    bootstrapping,
    currentTab,
    refreshRecordings,
    refreshDictionary,
    refreshStorage,
    refreshAiUsage,
  ]);

  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!token) {
    return (
      <AuthView
        onAuthenticated={(user, accessToken) => {
          setToken(accessToken);
          setTokenState(accessToken);
          setSettings(mapMeToSettings(user as UserSettings & { id: string }));
          setRecordingsLoaded(false);
          setDictionaryLoaded(false);
          setStorageLoaded(false);
          setAiUsageLoaded(false);
          setBootstrapping(false);
        }}
      />
    );
  }

  if (bootstrapping) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-600 text-sm font-bold">
        Đang tải Sonic Scribe...
      </div>
    );
  }

  const handleSelectRecording = async (rec: Recording) => {
    try {
      const full = await recordingsApi.get(rec.id);
      setSelectedRecording(full);
      setCurrentTab('recording_detail');
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không tải được chi tiết transcript.',
      });
    }
  };

  const handleDeleteRecording = async (id: string) => {
    const target = recordings.find((r) => r.id === id) || null;
    if (!target) return;
    const ok = await confirm({
      title: 'Xóa bản ghi này?',
      message: `Bản ghi “${target.title}” sẽ bị xóa vĩnh viễn, gồm audio và transcript trên cloud.`,
      confirmLabel: 'Xóa',
      cancelLabel: 'Hủy',
      danger: true,
    });
    if (!ok) return;
    try {
      await recordingsApi.remove(target.id);
      setRecordings((prev) => prev.filter((r) => r.id !== target.id));
      if (playingRecording?.id === target.id) setPlayingRecording(null);
      if (selectedRecording?.id === target.id) {
        setSelectedRecording(null);
        setCurrentTab('recordings');
      }
      setToast({ type: 'success', message: 'Đã xóa bản ghi trên cloud.' });
      void refreshStorage(true);
    } catch (err) {
      setToast({
        type: 'error',
        message: err instanceof Error ? err.message : 'Xóa thất bại',
      });
    }
  };

  const handleSaveNewRecording = async (newRec: Recording) => {
    setRecordings((prev) =>
      sortNewestFirst([newRec, ...prev.filter((r) => r.id !== newRec.id)]),
    );
    setRecordingsLoaded(true);
    setCurrentTab('recordings');
    setToast({
      type: 'success',
      message: newRec.hasAudio
        ? 'Đã lưu bản ghi (có audio + transcript).'
        : 'Đã lưu transcript (audio upload chưa thành công).',
    });
    void refreshRecordings(true);
    void refreshStorage(true);
    void refreshAiUsage(true);
  };

  const handleAddWordToDictionary = async (
    item: Omit<DictionaryItem, 'id'>,
  ) => {
    const created = await dictionaryApi.create(item);
    setDictionaryItems((prev) => [created, ...prev]);
    setDictionaryLoaded(true);
  };

  const handleDeleteWordFromDictionary = async (id: string) => {
    await dictionaryApi.remove(id);
    setDictionaryItems((prev) => prev.filter((item) => item.id !== id));
    void refreshStorage(true);
  };

  const handleRegenerateSummary = async (recordingId: string) => {
    try {
      const updated = await recordingsApi.summarize(recordingId);
      setSelectedRecording(updated);
      setRecordings((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r)),
      );
      setToast({ type: 'success', message: 'Đã tạo / cập nhật tóm tắt AI.' });
      void refreshAiUsage(true);
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Tóm tắt AI thất bại',
      });
      throw err;
    }
  };

  const handleRetranscribe = async (
    recordingId: string,
    language: 'en' | 'vi' = 'en',
  ) => {
    try {
      const updated = await recordingsApi.retranscribe(recordingId, {
        language,
        translate: language === 'en',
      });
      setSelectedRecording(updated);
      setRecordings((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)),
      );
      setToast({
        type: 'success',
        message: updated.sttProvider
          ? `Đã transcript lại (via ${updated.sttProvider}).`
          : 'Đã transcript lại từ audio.',
      });
      void refreshAiUsage(true);
    } catch (err) {
      setToast({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Transcript lại thất bại',
      });
      throw err;
    }
  };

  const handleUpdateSettings = async (next: UserSettings) => {
    const updated = await usersApi.updateSettings({
      name: next.name,
      avatar: next.avatar,
      primaryLang: next.primaryLang,
      secondaryLang: next.secondaryLang,
      sampleRate: next.sampleRate,
      aiNoiseCancellation: next.aiNoiseCancellation,
      theme: next.theme,
    });
    setSettings(mapMeToSettings(updated));
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'recordings':
        return (
          <LibraryView
            recordings={recordings}
            settings={settings}
            loading={recordingsLoading && !recordingsLoaded}
            loadError={loadError}
            onSelectRecording={(rec) => void handleSelectRecording(rec)}
            onPlay={setPlayingRecording}
            onDelete={(id) => void handleDeleteRecording(id)}
            onStartNewRecording={() => setCurrentTab('recording_live')}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'recording_detail':
        return selectedRecording ? (
          <DetailView
            recording={selectedRecording}
            onBack={() => setCurrentTab('recordings')}
            onAddWordToDictionary={(item) => void handleAddWordToDictionary(item)}
            onRegenerateSummary={(id) => void handleRegenerateSummary(id)}
            onRetranscribe={(id, lang) => void handleRetranscribe(id, lang)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-slate-500">Chưa chọn bản ghi</p>
          </div>
        );
      case 'recording_live':
        return (
          <LiveRecordView
            settings={settings}
            token={token}
            onSaveRecording={handleSaveNewRecording}
            onCancel={() => setCurrentTab('recordings')}
          />
        );
      case 'settings':
        return (
          <SettingsView
            settings={settings}
            onUpdateSettings={(s) => void handleUpdateSettings(s)}
            setCurrentTab={setCurrentTab}
            onLogout={() => {
              setToken(null);
              setTokenState(null);
            }}
          />
        );
      case 'dictionary':
        return (
          <DictionaryView
            dictionaryItems={dictionaryItems}
            loading={dictionaryLoading && !dictionaryLoaded}
            onAddWord={(item) => void handleAddWordToDictionary(item)}
            onDeleteWord={(id) => void handleDeleteWordFromDictionary(id)}
          />
        );
      case 'ai_usage':
        return (
          <AiUsageView
            isAdmin={settings.role === 'admin'}
            usedTokens={aiUsedTokens}
            quotaTokens={aiQuotaTokens}
          />
        );
      case 'admin':
        return settings.role === 'admin' ? (
          <AdminUsersView currentUserId={settings.id} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-sm text-rose-600 font-semibold">
              Chỉ admin mới truy cập được màn RBAC.
            </p>
          </div>
        );
      case 'dashboard':
        return (
          <DashboardView
            settings={settings}
            recordings={recordings}
            dictionaryItems={dictionaryItems}
            recordingsLoading={recordingsLoading && !recordingsLoaded}
            dictionaryLoading={dictionaryLoading && !dictionaryLoaded}
            loadError={loadError}
            storageUsedBytes={storageUsedBytes}
            storageQuotaBytes={storageQuotaBytes}
            onSelectRecording={(rec) => void handleSelectRecording(rec)}
            onStartNewRecording={() => setCurrentTab('recording_live')}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'translations':
        return (
          <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 pb-24">
            <h2 className="text-xl font-extrabold mb-4">Thư viện song ngữ</h2>
            {recordingsLoading && !recordingsLoaded ? (
              <p className="text-sm text-slate-500 font-medium">Đang tải…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortNewestFirst(recordings.filter((r) => r.isTranslated)).map(
                  (rec) => (
                    <button
                      key={rec.id}
                      onClick={() => void handleSelectRecording(rec)}
                      className="text-left bg-white dark:bg-slate-900 p-5 rounded-2xl border hover:border-blue-600"
                    >
                      <span className="text-[10px] font-extrabold text-blue-600 flex items-center gap-1">
                        <Languages className="w-3.5 h-3.5" /> Song ngữ
                      </span>
                      <h3 className="font-extrabold mt-2">{rec.title}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {rec.summary}
                      </p>
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
        );
      case 'analytics':
        return (
          <AnalyticsView
            recordings={recordings}
            dictionaryItems={dictionaryItems}
            recordingsLoading={recordingsLoading && !recordingsLoaded}
            dictionaryLoading={dictionaryLoading && !dictionaryLoaded}
            setCurrentTab={setCurrentTab}
          />
        );
      case 'help':
        return (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 pb-24">
            <HelpCircle className="w-14 h-14 text-blue-500 mb-4" />
            <h2 className="font-extrabold">Sonic Scribe</h2>
            <p className="text-sm text-slate-500 max-w-sm mt-2">
              Nhấn Ghi âm mới, nói tiếng Anh — hệ thống chuyển lời và dịch Việt
              realtime, rồi lưu để ôn tập.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        storageUsedBytes={storageUsedBytes}
        storageQuotaBytes={storageQuotaBytes}
        storageLoading={storageLoading}
        aiUsedTokens={aiUsedTokens}
        aiQuotaTokens={aiQuotaTokens}
        aiUsageLoading={aiUsageLoading}
        isAdmin={settings.role === 'admin'}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {renderContent()}
        {playingRecording && (
          <FloatingPlayer
            recording={playingRecording}
            onClose={() => setPlayingRecording(null)}
          />
        )}
      </main>
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2.5 rounded-full text-xs font-bold text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}
