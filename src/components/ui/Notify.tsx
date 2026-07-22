import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export type NotifyTone = 'success' | 'error' | 'info';

type ToastItem = {
  id: number;
  tone: NotifyTone;
  message: string;
};

export type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Visual emphasis for destructive actions */
  danger?: boolean;
};

type ConfirmState = ConfirmOptions & {
  resolve: (ok: boolean) => void;
};

type NotifyContextValue = {
  toast: (message: string, tone?: NotifyTone) => void;
  confirm: (opts: ConfirmOptions) => Promise<boolean>;
};

const NotifyContext = createContext<NotifyContextValue | null>(null);

export function useNotify() {
  const ctx = useContext(NotifyContext);
  if (!ctx) {
    throw new Error('useNotify must be used within NotifyProvider');
  }
  return ctx;
}

export function NotifyProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const toast = useCallback((message: string, tone: NotifyTone = 'info') => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((prev) => [...prev.slice(-4), { id, tone, message }]);
  }, []);

  const confirm = useCallback(
    (opts: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        setConfirmState((prev) => {
          // Resolve any pending confirm as cancel before opening a new one
          prev?.resolve(false);
          return { ...opts, resolve };
        });
      }),
    [],
  );

  const closeConfirm = useCallback((ok: boolean) => {
    setConfirmState((prev) => {
      prev?.resolve(ok);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id));
      }, 3200),
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts]);

  useEffect(() => {
    if (!confirmState) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeConfirm(false);
      if (e.key === 'Enter') closeConfirm(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmState, closeConfirm]);

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <NotifyContext.Provider value={value}>
      {children}

      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[90] flex flex-col gap-2 w-[min(92vw,420px)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg text-center ${
              t.tone === 'success'
                ? 'bg-emerald-600'
                : t.tone === 'error'
                  ? 'bg-rose-600'
                  : 'bg-slate-900'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {confirmState && (
        <div
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Đóng"
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-[3px] border-0 cursor-default"
            onClick={() => closeConfirm(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-desc"
            className="relative w-full sm:max-w-[400px] bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.35)] p-5 sm:p-6 space-y-5"
          >
            <div className="flex flex-col items-center text-center gap-3 sm:flex-row sm:items-start sm:text-left sm:gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmState.danger
                    ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400'
                }`}
              >
                {confirmState.danger ? (
                  <AlertTriangle className="w-5 h-5" strokeWidth={2.25} />
                ) : (
                  <Info className="w-5 h-5" strokeWidth={2.25} />
                )}
              </div>
              <div className="min-w-0 space-y-1.5">
                <h3
                  id="confirm-title"
                  className="text-[15px] font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug"
                >
                  {confirmState.title}
                </h3>
                <p
                  id="confirm-desc"
                  className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed"
                >
                  {confirmState.message}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => closeConfirm(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {confirmState.cancelLabel || 'Hủy'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => closeConfirm(true)}
                className={`w-full sm:w-auto px-4 py-2.5 text-sm font-bold rounded-xl text-white transition-colors ${
                  confirmState.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmState.confirmLabel || 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </NotifyContext.Provider>
  );
}
