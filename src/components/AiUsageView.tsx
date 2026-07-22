import React, { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw, Sparkles, Zap } from 'lucide-react';
import { aiApi } from '../lib/api';
import type { AiUsageEvent, AiUsageSummary } from '../types';

function formatTokens(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

const featureLabel: Record<string, string> = {
  summarize: 'Tóm tắt',
  translate: 'Dịch Gemini',
  transcribe: 'STT / Transcribe',
};

interface AiUsageViewProps {
  isAdmin?: boolean;
  /** Prefetched sidebar values — view still refreshes its own detail. */
  usedTokens?: number;
  quotaTokens?: number;
}

export default function AiUsageView({
  isAdmin = false,
  usedTokens: usedProp,
  quotaTokens: quotaProp,
}: AiUsageViewProps) {
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);
  const [events, setEvents] = useState<AiUsageEvent[]>([]);
  const [allUsers, setAllUsers] = useState<AiUsageSummary[]>([]);
  const [usedTokens, setUsedTokens] = useState(usedProp ?? 0);
  const [quotaTokens, setQuotaTokens] = useState(quotaProp ?? 1_500_000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mine = await aiApi.usage();
      setSummary(mine.summary);
      setEvents(mine.events);
      setUsedTokens(mine.usedTokens ?? mine.summary.totalTokens ?? 0);
      setQuotaTokens(
        mine.quotaTokens ?? mine.summary.quotaTokens ?? 1_500_000,
      );
      if (isAdmin) {
        const all = await aiApi.usageAll();
        setAllUsers(all.items);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được usage');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void load();
  }, [load]);

  const byFeature = summary?.byFeature ?? {};
  const byModel = summary?.byModel ?? {};
  const quota = quotaTokens > 0 ? quotaTokens : 1;
  const percentage = Math.min(100, (usedTokens / quota) * 100);
  const barColor =
    percentage >= 90
      ? 'bg-rose-500'
      : percentage >= 70
        ? 'bg-amber-500'
        : 'bg-violet-600 dark:bg-violet-500';

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold">AI Token Usage</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Dung lượng token Gemini đã dùng (tóm tắt / dịch / transcribe) —
            giống meter lưu trữ. Free translators không tính token.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <p className="text-xs text-rose-600 mb-4 font-medium">{error}</p>
      )}

      {/* Quota meter — mirrors storage panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1">
            Dung lượng token AI
          </p>
          <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            {loading && !summary
              ? 'Đang đo usage...'
              : `${formatTokens(usedTokens)} / ${formatTokens(quotaTokens)} tokens (${Math.round(percentage)}%)`}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Soft quota hiển thị trong app (`AI_TOKEN_QUOTA`) — không phải hạn mức
            Google AI Studio realtime.
          </p>
        </div>
        <div className="absolute -right-3 -bottom-3 opacity-5">
          <Zap className="w-24 h-24" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Tổng token
            </span>
          </div>
          <p className="text-2xl font-black">
            {formatTokens(summary?.totalTokens ?? usedTokens)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-emerald-600 mb-2">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Prompt / Completion
            </span>
          </div>
          <p className="text-sm font-bold">
            {formatTokens(summary?.totalPromptTokens ?? 0)}
            <span className="text-slate-400 font-medium"> / </span>
            {formatTokens(summary?.totalCompletionTokens ?? 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Số lần gọi
            </span>
          </div>
          <p className="text-2xl font-black">{summary?.requestCount ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            Theo chức năng
          </h3>
          <div className="space-y-2">
            {Object.keys(byFeature).length === 0 && (
              <p className="text-xs text-slate-500">Chưa có dữ liệu Gemini.</p>
            )}
            {Object.entries(byFeature).map(([key, tokens]) => {
              const share = usedTokens > 0 ? (tokens / usedTokens) * 100 : 0;
              return (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>{featureLabel[key] || key}</span>
                    <span className="font-mono text-xs">
                      {formatTokens(tokens)} tok
                    </span>
                  </div>
                  <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, share)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            Theo model
          </h3>
          <div className="space-y-2">
            {Object.keys(byModel).length === 0 && (
              <p className="text-xs text-slate-500">
                Chưa có breakdown theo model (sẽ có sau các lần gọi mới).
              </p>
            )}
            {Object.entries(byModel).map(([key, tokens]) => (
              <div
                key={key}
                className="flex items-center justify-between text-sm font-semibold"
              >
                <span className="font-mono text-[11px] truncate max-w-[70%]">
                  {key.replace(/_/g, '-')}
                </span>
                <span className="font-mono text-xs">
                  {formatTokens(tokens)} tok
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Lịch sử gần đây
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 uppercase tracking-wider">
                <th className="py-2 pr-3 font-bold">Thời gian</th>
                <th className="py-2 pr-3 font-bold">Chức năng</th>
                <th className="py-2 pr-3 font-bold">Model</th>
                <th className="py-2 font-bold text-right">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-3 text-slate-500">
                    Chưa có event.
                  </td>
                </tr>
              )}
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-t border-slate-100 dark:border-slate-800"
                >
                  <td className="py-2 pr-3 text-slate-500">
                    {new Date(ev.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 pr-3 font-semibold">
                    {featureLabel[ev.feature] || ev.feature}
                  </td>
                  <td className="py-2 pr-3 font-mono text-[10px]">{ev.model}</td>
                  <td className="py-2 text-right font-mono">
                    {formatTokens(ev.totalTokens)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
            Tất cả user (admin)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider">
                  <th className="py-2 pr-3 font-bold">User</th>
                  <th className="py-2 pr-3 font-bold">Requests</th>
                  <th className="py-2 font-bold text-right">Total tokens</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-3 text-slate-500">
                      Chưa có usage toàn hệ thống.
                    </td>
                  </tr>
                )}
                {allUsers.map((u) => (
                  <tr
                    key={u.userId}
                    className="border-t border-slate-100 dark:border-slate-800"
                  >
                    <td className="py-2 pr-3">
                      <div className="font-semibold">{u.name || u.userId}</div>
                      <div className="text-slate-400">{u.email}</div>
                    </td>
                    <td className="py-2 pr-3">{u.requestCount}</td>
                    <td className="py-2 text-right font-mono">
                      {formatTokens(u.totalTokens)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
