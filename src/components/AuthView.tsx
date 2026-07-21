import React, { useState } from 'react';
import { Mic, Lock, Mail, User, Sparkles } from 'lucide-react';
import { authApi, setToken } from '../lib/api';
import { UserSettings } from '../types';

interface AuthViewProps {
  onAuthenticated: (user: UserSettings & { id: string }, token: string) => void;
}

export default function AuthView({ onAuthenticated }: AuthViewProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result =
        mode === 'login'
          ? await authApi.login({ email, password })
          : await authApi.register({ name, email, password });
      setToken(result.accessToken);
      onAuthenticated(result.user, result.accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50 to-slate-200 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
            <Mic className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Sonic Scribe
            </h1>
            <p className="text-xs text-slate-500 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Ghi âm · Chuyển lời · Dịch tức thì
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Họ tên
              </span>
              <div className="mt-1 flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  className="flex-1 bg-transparent outline-none text-sm font-medium"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  minLength={2}
                  placeholder="Nguyễn Văn A"
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Email
            </span>
            <div className="mt-1 flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
              <Mail className="w-4 h-4 text-slate-400" />
              <input
                type="email"
                className="flex-1 bg-transparent outline-none text-sm font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ban@email.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Mật khẩu
            </span>
            <div className="mt-1 flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5">
              <Lock className="w-4 h-4 text-slate-400" />
              <input
                type="password"
                className="flex-1 bg-transparent outline-none text-sm font-medium"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Tối thiểu 8 ký tự"
              />
            </div>
          </label>

          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold transition-all"
          >
            {loading
              ? 'Đang xử lý...'
              : mode === 'login'
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          className="mt-4 w-full text-center text-xs font-bold text-blue-600 hover:underline"
        >
          {mode === 'login'
            ? 'Chưa có tài khoản? Đăng ký'
            : 'Đã có tài khoản? Đăng nhập'}
        </button>
      </div>
    </div>
  );
}
