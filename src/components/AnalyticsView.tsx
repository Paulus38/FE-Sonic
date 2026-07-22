import React, { useMemo } from 'react';
import {
  BarChart3,
  Mic,
  BookOpen,
  Languages,
  Clock,
  AudioLines,
  PieChart,
  Tag,
} from 'lucide-react';
import { DictionaryItem, Recording } from '../types';

function formatDurationTotal(totalSec: number): string {
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function recordingTime(rec: Recording): number {
  if (rec.createdAt) {
    const t = Date.parse(rec.createdAt);
    if (!Number.isNaN(t)) return t;
  }
  return 0;
}

interface AnalyticsViewProps {
  recordings: Recording[];
  dictionaryItems: DictionaryItem[];
  recordingsLoading?: boolean;
  dictionaryLoading?: boolean;
  setCurrentTab: (tab: string) => void;
}

export default function AnalyticsView({
  recordings,
  dictionaryItems,
  recordingsLoading = false,
  dictionaryLoading = false,
  setCurrentTab,
}: AnalyticsViewProps) {
  const data = useMemo(() => {
    const totalDurationSec = recordings.reduce(
      (s, r) => s + (r.durationSec || 0),
      0,
    );
    const avgDurationSec =
      recordings.length > 0
        ? Math.round(totalDurationSec / recordings.length)
        : 0;
    const translated = recordings.filter((r) => r.isTranslated).length;
    const withAudio = recordings.filter((r) => r.hasAudio).length;
    const withSummary = recordings.filter(
      (r) => (r.aiSummary || '').trim().length > 0,
    ).length;

    const byCategory: Record<string, { count: number; duration: number }> = {};
    for (const r of recordings) {
      const key = r.category || 'Khác';
      if (!byCategory[key]) byCategory[key] = { count: 0, duration: 0 };
      byCategory[key].count += 1;
      byCategory[key].duration += r.durationSec || 0;
    }

    const byDictCategory: Record<string, number> = {};
    for (const d of dictionaryItems) {
      const key = d.category || 'Khác';
      byDictCategory[key] = (byDictCategory[key] || 0) + 1;
    }

    const tagFreq: Record<string, number> = {};
    for (const r of recordings) {
      for (const tag of r.tags || []) {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      }
    }
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setTime(dayStart.getTime() - (6 - i) * dayMs);
      const dayEnd = dayStart.getTime() + dayMs;
      const count = recordings.filter((r) => {
        const t = recordingTime(r);
        return t >= dayStart.getTime() && t < dayEnd;
      }).length;
      return {
        label: dayStart.toLocaleDateString('vi-VN', { weekday: 'short' }),
        count,
      };
    });
    const maxDay = Math.max(1, ...last7.map((d) => d.count));

    const monthAgo = now - 30 * dayMs;
    const thisMonth = recordings.filter(
      (r) => recordingTime(r) >= monthAgo,
    ).length;

    return {
      totalDurationSec,
      avgDurationSec,
      translated,
      withAudio,
      withSummary,
      byCategory,
      byDictCategory,
      topTags,
      last7,
      maxDay,
      thisMonth,
      translateRate:
        recordings.length > 0
          ? Math.round((translated / recordings.length) * 100)
          : 0,
      audioRate:
        recordings.length > 0
          ? Math.round((withAudio / recordings.length) * 100)
          : 0,
    };
  }, [recordings, dictionaryItems]);

  const loading = recordingsLoading || dictionaryLoading;
  const maxCat = Math.max(
    1,
    ...Object.values(data.byCategory).map((c) => c.count),
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 pb-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2 text-slate-950 dark:text-white">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Phân tích
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {loading
              ? 'Đang tải dữ liệu…'
              : `Tổng ${recordings.length} bản ghi · ${dictionaryItems.length} từ vựng · ${data.thisMonth} bản ghi 30 ngày gần đây`}
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <Metric
            icon={<Mic className="w-4 h-4 text-blue-600" />}
            label="Tổng bản ghi"
            value={loading ? '…' : String(recordings.length)}
          />
          <Metric
            icon={<Clock className="w-4 h-4 text-amber-500" />}
            label="TB / bản ghi"
            value={
              loading ? '…' : formatDurationTotal(data.avgDurationSec)
            }
          />
          <Metric
            icon={<Languages className="w-4 h-4 text-violet-500" />}
            label="Tỷ lệ song ngữ"
            value={loading ? '…' : `${data.translateRate}%`}
          />
          <Metric
            icon={<AudioLines className="w-4 h-4 text-emerald-500" />}
            label="Có file audio"
            value={loading ? '…' : `${data.audioRate}%`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-extrabold">Hoạt động 7 ngày</h3>
            <div className="flex items-end gap-2 h-36">
              {data.last7.map((d) => (
                <div
                  key={d.label}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                >
                  <span className="text-[10px] font-bold text-slate-400">
                    {d.count || ''}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-blue-500/80 dark:bg-blue-500 min-h-[4px] transition-all"
                    style={{
                      height: `${Math.max(4, (d.count / data.maxDay) * 100)}%`,
                    }}
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-blue-600" />
              Phân bố theo danh mục
            </h3>
            {Object.keys(data.byCategory).length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                Chưa đủ dữ liệu để phân tích
              </p>
            ) : (
              <ul className="space-y-3">
                {Object.entries(data.byCategory)
                  .sort((a, b) => b[1].count - a[1].count)
                  .map(([cat, info]) => (
                    <li key={cat}>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span>{cat}</span>
                        <span className="text-slate-400 font-medium">
                          {info.count} bản ·{' '}
                          {formatDurationTotal(info.duration)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{
                            width: `${(info.count / maxCat) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-extrabold">Chất lượng nội dung</h3>
            <QualityRow
              label="Có bản dịch song ngữ"
              value={data.translated}
              total={recordings.length}
            />
            <QualityRow
              label="Có file âm thanh"
              value={data.withAudio}
              total={recordings.length}
            />
            <QualityRow
              label="Có tóm tắt AI"
              value={data.withSummary}
              total={recordings.length}
            />
            <p className="text-[11px] text-slate-400 pt-1">
              Tổng thời lượng:{' '}
              <strong className="text-slate-600 dark:text-slate-300">
                {formatDurationTotal(data.totalDurationSec)}
              </strong>
            </p>
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Từ điển theo chủ đề
            </h3>
            {Object.keys(data.byDictCategory).length === 0 ? (
              <div className="py-4 text-center space-y-2">
                <p className="text-xs text-slate-400">Chưa có từ vựng</p>
                <button
                  type="button"
                  onClick={() => setCurrentTab('dictionary')}
                  className="text-[11px] font-bold text-blue-600 hover:underline"
                >
                  Mở từ điển
                </button>
              </div>
            ) : (
              <ul className="space-y-2">
                {Object.entries(data.byDictCategory)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, count]) => (
                    <li
                      key={cat}
                      className="flex justify-between text-xs font-semibold"
                    >
                      <span className="text-slate-700 dark:text-slate-300">
                        {cat}
                      </span>
                      <span className="text-slate-400">{count} từ</span>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-500" />
              Thẻ phổ biến
            </h3>
            {data.topTags.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                Chưa có thẻ
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {data.topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold px-2.5 py-1 rounded-lg"
                  >
                    #{tag}
                    <span className="text-slate-400 font-medium">{count}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
          {label}
        </p>
      </div>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}

function QualityRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] font-bold mb-1">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="text-slate-400">
          {value}/{total} · {pct}%
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
