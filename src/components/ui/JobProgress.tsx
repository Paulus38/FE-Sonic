import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, CheckCircle2, XCircle, X } from 'lucide-react';

export type JobStatus = 'running' | 'done' | 'error';

export type ProgressJob = {
  id: string;
  label: string;
  detail?: string;
  progress: number;
  status: JobStatus;
};

type StartJobOptions = {
  /** Soft time estimate — progress climbs toward 92% until complete/fail */
  estimatedMs?: number;
  detail?: string;
};

type JobProgressContextValue = {
  jobs: ProgressJob[];
  startJob: (label: string, opts?: StartJobOptions) => string;
  updateJob: (
    id: string,
    patch: Partial<Pick<ProgressJob, 'label' | 'detail' | 'progress'>>,
  ) => void;
  completeJob: (id: string, detail?: string) => void;
  failJob: (id: string, detail?: string) => void;
  /** Run async work with time-based %; completes/fails automatically */
  runTimedJob: <T>(
    label: string,
    task: () => Promise<T>,
    opts?: StartJobOptions,
  ) => Promise<T>;
};

const JobProgressContext = createContext<JobProgressContextValue | null>(null);

let jobSeq = 0;

export function useJobProgress() {
  const ctx = useContext(JobProgressContext);
  if (!ctx) {
    throw new Error('useJobProgress must be used within JobProgressProvider');
  }
  return ctx;
}

/** Optional: safe when provider may be missing in tests */
export function useJobProgressOptional() {
  return useContext(JobProgressContext);
}

export function JobProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [jobs, setJobs] = useState<ProgressJob[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const removeTimersRef = useRef<Map<string, number>>(new Map());

  const clearEstimateTimer = useCallback((id: string) => {
    const t = timersRef.current.get(id);
    if (t != null) {
      window.clearInterval(t);
      timersRef.current.delete(id);
    }
  }, []);

  const scheduleRemove = useCallback((id: string, delayMs = 1200) => {
    const prev = removeTimersRef.current.get(id);
    if (prev != null) window.clearTimeout(prev);
    const t = window.setTimeout(() => {
      removeTimersRef.current.delete(id);
      setJobs((list) => list.filter((j) => j.id !== id));
    }, delayMs);
    removeTimersRef.current.set(id, t);
  }, []);

  const startJob = useCallback(
    (label: string, opts?: StartJobOptions) => {
      const id = `job-${++jobSeq}-${Date.now()}`;
      setJobs((list) => [
        ...list,
        {
          id,
          label,
          detail: opts?.detail,
          progress: 1,
          status: 'running',
        },
      ]);

      const estimatedMs = opts?.estimatedMs;
      if (estimatedMs && estimatedMs > 0) {
        const startedAt = Date.now();
        const timer = window.setInterval(() => {
          const elapsed = Date.now() - startedAt;
          const pct = Math.min(92, Math.round((elapsed / estimatedMs) * 100));
          setJobs((list) =>
            list.map((j) =>
              j.id === id && j.status === 'running'
                ? { ...j, progress: Math.max(1, pct) }
                : j,
            ),
          );
        }, 200);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [],
  );

  const updateJob = useCallback(
    (
      id: string,
      patch: Partial<Pick<ProgressJob, 'label' | 'detail' | 'progress'>>,
    ) => {
      setJobs((list) =>
        list.map((j) => {
          if (j.id !== id || j.status !== 'running') return j;
          const next = { ...j, ...patch };
          if (typeof patch.progress === 'number') {
            next.progress = Math.max(0, Math.min(99, Math.round(patch.progress)));
            // Real % updates → stop soft estimate timer
            clearEstimateTimer(id);
          }
          return next;
        }),
      );
    },
    [clearEstimateTimer],
  );

  const completeJob = useCallback(
    (id: string, detail?: string) => {
      clearEstimateTimer(id);
      setJobs((list) =>
        list.map((j) =>
          j.id === id
            ? {
                ...j,
                progress: 100,
                status: 'done' as const,
                detail: detail ?? j.detail,
              }
            : j,
        ),
      );
      scheduleRemove(id);
    },
    [clearEstimateTimer, scheduleRemove],
  );

  const failJob = useCallback(
    (id: string, detail?: string) => {
      clearEstimateTimer(id);
      setJobs((list) =>
        list.map((j) =>
          j.id === id
            ? {
                ...j,
                status: 'error' as const,
                detail: detail ?? j.detail ?? 'Thất bại',
              }
            : j,
        ),
      );
      scheduleRemove(id, 2800);
    },
    [clearEstimateTimer, scheduleRemove],
  );

  const runTimedJob = useCallback(
    async <T,>(
      label: string,
      task: () => Promise<T>,
      opts?: StartJobOptions,
    ): Promise<T> => {
      const id = startJob(label, opts);
      try {
        const result = await task();
        completeJob(id);
        return result;
      } catch (err) {
        failJob(
          id,
          err instanceof Error ? err.message.slice(0, 120) : 'Thất bại',
        );
        throw err;
      }
    },
    [startJob, completeJob, failJob],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => window.clearInterval(t));
      removeTimersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.clear();
      removeTimersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      jobs,
      startJob,
      updateJob,
      completeJob,
      failJob,
      runTimedJob,
    }),
    [jobs, startJob, updateJob, completeJob, failJob, runTimedJob],
  );

  const visible = jobs.length > 0;

  return (
    <JobProgressContext.Provider value={value}>
      {children}
      {visible && (
        <div
          className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-4 bg-slate-900/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label="Tiến trình xử lý"
        >
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600">
                  Đang xử lý
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {jobs.filter((j) => j.status === 'running').length > 0
                    ? `${jobs.filter((j) => j.status === 'running').length} tác vụ`
                    : 'Hoàn tất'}
                </p>
              </div>
              {jobs.every((j) => j.status !== 'running') && (
                <button
                  type="button"
                  onClick={() => setJobs([])}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <ul className="max-h-[50vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {jobs.map((job) => (
                <li key={job.id} className="px-4 py-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      {job.status === 'running' && (
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      )}
                      {job.status === 'done' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      {job.status === 'error' && (
                        <XCircle className="w-4 h-4 text-rose-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {job.label}
                        </p>
                        <span
                          className={`text-[11px] font-extrabold tabular-nums shrink-0 ${
                            job.status === 'error'
                              ? 'text-rose-600'
                              : job.status === 'done'
                                ? 'text-emerald-600'
                                : 'text-blue-600'
                          }`}
                        >
                          {job.status === 'error' ? '!' : `${job.progress}%`}
                        </span>
                      </div>
                      {job.detail && (
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                          {job.detail}
                        </p>
                      )}
                      <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-[width] duration-200 ease-out ${
                            job.status === 'error'
                              ? 'bg-rose-500'
                              : job.status === 'done'
                                ? 'bg-emerald-500'
                                : 'bg-blue-600'
                          }`}
                          style={{
                            width: `${
                              job.status === 'error'
                                ? Math.max(job.progress, 8)
                                : job.progress
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </JobProgressContext.Provider>
  );
}

/** Estimate STT / summarize wall time from audio duration (ms). */
export function estimateApiMsFromDuration(
  durationSec: number,
  kind: 'transcribe' | 'summarize' | 'upload' = 'transcribe',
): number {
  const s = Math.max(0, durationSec || 0);
  if (kind === 'summarize') {
    return Math.min(60_000, Math.max(8_000, 8_000 + s * 80));
  }
  if (kind === 'upload') {
    return Math.min(90_000, Math.max(5_000, 3_000 + s * 120));
  }
  // transcribe ~0.35× realtime + overhead
  return Math.min(120_000, Math.max(10_000, s * 350 + 8_000));
}
