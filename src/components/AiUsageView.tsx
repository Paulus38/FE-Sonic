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
}

export default function AiUsageView({ isAdmin = false }: AiUsageViewProps) {
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);
  const [events, setEvents] = useState<AiUsageEvent[]>([]);
  const [allUsers, setAllUsers] = useState<AiUsageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mine = await aiApi.usage();
      setSummary(mine.summary);
      setEvents(mine.events);
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

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl font-extrabold">AI Token Usage</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Theo dõi token Gemini đã dùng (summarize / translate / transcribe).
            Free translators không tính token.
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-indigo-600 mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">
              Tổng token
            </span>
          </div>
          <p className="text-2xl font-black">
            {formatTokens(summary?.totalTokens ?? 0)}
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
          Theo chức năng
        </h3>
        <div className="space-y-2">
          {Object.keys(byFeature).length === 0 && (
            <p className="text-xs text-slate-500">Chưa có dữ liệu Gemini.</p>
          )}
          {Object.entries(byFeature).map(([key, tokens]) => (
            <div
              key={key}
              className="flex items-center justify-between text-sm font-semibold"
            >
              <span>{featureLabel[key] || key}</span>
              <span className="font-mono text-xs">{formatTokens(tokens)} tok</span>
            </div>
          ))}
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
