import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw, ScrollText } from 'lucide-react';
import { adminApi } from '../lib/api';
import type { AuditLogEntry } from '../types';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  } catch {
    return iso;
  }
}

export default function AdminLogsView() {
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.listLogs({
        limit: 100,
        action: actionFilter.trim() || undefined,
      });
      setItems(res.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được nhật ký');
    } finally {
      setLoading(false);
    }
  }, [actionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-1">
              <ScrollText className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Admin
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Nhật ký hệ thống
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Audit trail: đăng nhập, bản ghi, AI, thao tác quản trị.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Lọc action (vd. auth.login)"
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 w-52"
            />
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Làm mới
            </button>
          </div>
        </header>

        {error && (
          <p className="text-sm text-rose-600 font-medium bg-rose-50 dark:bg-rose-950/40 px-4 py-3 rounded-lg">
            {error}
          </p>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Resource</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading && items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                      Đang tải…
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-10 text-center text-slate-400"
                    >
                      Chưa có nhật ký nào.
                    </td>
                  </tr>
                ) : (
                  items.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {formatTime(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-800 dark:text-slate-100">
                        <div className="font-medium truncate max-w-[160px]">
                          {row.userEmail || '—'}
                        </div>
                        {row.userId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[160px]">
                            {row.userId.slice(0, 8)}…
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-indigo-600 dark:text-indigo-400">
                        {row.action}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {row.resource}
                        {row.resourceId && (
                          <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            {row.resourceId.slice(0, 8)}…
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            row.status === 'ok'
                              ? 'inline-flex px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                              : 'inline-flex px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
                          }
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-[220px]">
                        <span className="line-clamp-2">
                          {row.message ||
                            (row.meta
                              ? JSON.stringify(row.meta)
                              : '—')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
