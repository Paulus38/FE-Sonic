import React, { useMemo } from 'react';
import {
  Mic,
  BookOpen,
  Languages,
  Clock,
  HardDrive,
  Sparkles,
  TrendingUp,
  Calendar,
  Play,
  CheckCircle2,
} from 'lucide-react';
import { DictionaryItem, Recording, UserSettings } from '../types';

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDurationTotal(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (hrs > 0) return `${hrs} giờ ${mins} phút`;
  return `${mins} phút`;
}

function recordingTime(rec: Recording): number {
  if (rec.createdAt) {
    const t = Date.parse(rec.createdAt);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

interface DashboardViewProps {
  settings: UserSettings;
  recordings: Recording[];
  dictionaryItems: DictionaryItem[];
  recordingsLoading?: boolean;
  dictionaryLoading?: boolean;
  loadError?: string;
  storageUsedBytes: number;
  storageQuotaBytes: number;
  onSelectRecording: (rec: Recording) => void;
  onStartNewRecording: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function DashboardView({
  settings,
  recordings,
  dictionaryItems,
  recordingsLoading = false,
  dictionaryLoading = false,
  loadError = '',
  storageUsedBytes,
  storageQuotaBytes,
  onSelectRecording,
  onStartNewRecording,
  setCurrentTab,
}: DashboardViewProps) {
  const stats = useMemo(() => {
    const totalDurationSec = recordings.reduce(
      (sum, r) => sum + (r.durationSec || 0),
      0,
    );
    const translated = recordings.filter((r) => r.isTranslated).length;
    const withAudio = recordings.filter((r) => r.hasAudio).length;
    const byCategory: Record<string, number> = {};
    for (const r of recordings) {
      const key = r.category || 'Khác';
      byCategory[key] = (byCategory[key] || 0) + 1;
    }
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const thisWeek = recordings.filter(
      (r) => recordingTime(r) >= weekAgo,
    ).length;
    const recent = [...recordings]
      .sort((a, b) => recordingTime(b) - recordingTime(a))
      .slice(0, 5);
    const quota = storageQuotaBytes > 0 ? storageQuotaBytes : 1;
    const storagePct = Math.min(100, (storageUsedBytes / quota) * 100);
    return {
      totalDurationSec,
      translated,
      withAudio,
      byCategory,
      thisWeek,
      recent,
      storagePct,
    };
  }, [recordings, storageUsedBytes, storageQuotaBytes]);

  const loading = recordingsLoading || dictionaryLoading;

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Tổng quan hoạt động
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Xin chào {settings.name || 'bạn'} — theo dõi tiến độ học & ghi âm
              của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewRecording}
            className="self-start bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            Ghi âm mới
          </button>
        </div>

        {loadError && (
          <p className="text-xs text-rose-600 font-semibold">{loadError}</p>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={<Mic className="w-5 h-5 text-blue-600" />}
            label="Bản ghi"
            value={loading ? '…' : String(recordings.length)}
            hint={`${stats.thisWeek} tuần này`}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-emerald-500" />}
            label="Từ vựng"
            value={loading ? '…' : String(dictionaryItems.length)}
            hint="Đã lưu trong từ điển"
          />
          <StatCard
            icon={<Languages className="w-5 h-5 text-violet-500" />}
            label="Song ngữ"
            value={loading ? '…' : String(stats.translated)}
            hint={`/${recordings.length || 0} bản ghi`}
          />
          <StatCard
            icon={<Clock className="w-5 h-5 text-amber-500" />}
            label="Tổng thời lượng"
            value={
              loading ? '…' : formatDurationTotal(stats.totalDurationSec)
            }
            hint={`${stats.withAudio} có audio`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Bản ghi gần đây
              </h3>
              <button
                type="button"
                onClick={() => setCurrentTab('recordings')}
                className="text-[11px] font-bold text-blue-600 hover:underline"
              >
                Xem thư viện
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-slate-500 py-6 text-center">Đang tải…</p>
            ) : stats.recent.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  Chưa có bản ghi nào
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Bắt đầu ghi âm để xem thống kê tại đây.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {stats.recent.map((rec) => (
                  <li key={rec.id}>
                    <button
                      type="button"
                      onClick={() => onSelectRecording(rec)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                        <Play className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{rec.title}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {rec.date}
                          </span>
                          <span>· {rec.duration}</span>
                          <span>· {rec.category}</span>
                        </p>
                      </div>
                      {rec.isTranslated && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-4">
            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-slate-500" />
                Dung lượng
              </h3>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${stats.storagePct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {formatBytes(storageUsedBytes)} /{' '}
                {formatBytes(storageQuotaBytes)} (
                {stats.storagePct.toFixed(0)}%)
              </p>
            </section>

            <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-500" />
                Theo danh mục
              </h3>
              {Object.keys(stats.byCategory).length === 0 ? (
                <p className="text-xs text-slate-400">Chưa có dữ liệu</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(stats.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => {
                      const pct =
                        recordings.length > 0
                          ? Math.round((count / recordings.length) * 100)
                          : 0;
                      return (
                        <li key={cat}>
                          <div className="flex justify-between text-[11px] font-bold mb-1">
                            <span>{cat}</span>
                            <span className="text-slate-400">
                              {count} · {pct}%
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>

            <section className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-5 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                Ngôn ngữ dịch
              </p>
              <p className="text-sm font-bold">
                {settings.primaryLang} → {settings.secondaryLang}
              </p>
              <button
                type="button"
                onClick={() => setCurrentTab('settings')}
                className="text-[11px] font-bold underline underline-offset-2 opacity-90 hover:opacity-100"
              >
                Đổi trong Cài đặt
              </button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-xl md:text-2xl font-black text-slate-950 dark:text-white leading-tight">
        {value}
      </p>
      <p className="text-[10px] text-slate-400 font-medium mt-1">{hint}</p>
    </div>
  );
}
