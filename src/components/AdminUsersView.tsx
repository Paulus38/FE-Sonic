import React, { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, RefreshCw, Shield, Trash2, X } from 'lucide-react';
import { adminApi } from '../lib/api';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type FormState = {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
};

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  role: 'user',
};

interface AdminUsersViewProps {
  currentUserId?: string;
}

export default function AdminUsersView({ currentUserId }: AdminUsersViewProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await adminApi.listUsers();
      setUsers(
        list.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role || 'user',
        })),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal('create');
    setError('');
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role === 'admin' ? 'admin' : 'user',
    });
    setModal('edit');
    setError('');
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (modal === 'create') {
        if (!form.password || form.password.length < 8) {
          throw new Error('Mật khẩu tối thiểu 8 ký tự');
        }
        const created = await adminApi.createUser({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
        setUsers((prev) =>
          [
            {
              id: created.id,
              name: created.name,
              email: created.email,
              role: created.role || form.role,
            },
            ...prev,
          ].sort((a, b) => a.email.localeCompare(b.email)),
        );
      } else if (modal === 'edit' && editing) {
        const body: {
          name?: string;
          email?: string;
          password?: string;
          role?: 'user' | 'admin';
        } = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };
        if (form.password.trim()) {
          body.password = form.password;
        }
        const updated = await adminApi.updateUser(editing.id, body);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editing.id
              ? {
                  id: updated.id,
                  name: updated.name,
                  email: updated.email,
                  role: updated.role || form.role,
                }
              : u,
          ),
        );
      }
      setModal(null);
      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lưu tài khoản thất bại');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget.id);
    setError('');
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xoá thất bại');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 pb-24 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Quản trị tài khoản
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Thêm / sửa / xoá account login + phân quyền{' '}
            <span className="font-mono">user</span> /{' '}
            <span className="font-mono">admin</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm account
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-rose-600 mb-4 font-medium">{error}</p>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-950/60">
            <tr className="text-slate-400 uppercase tracking-wider">
              <th className="px-4 py-3 font-bold">Người dùng</th>
              <th className="px-4 py-3 font-bold">Role</th>
              <th className="px-4 py-3 font-bold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-t border-slate-100 dark:border-slate-800"
              >
                <td className="px-4 py-3">
                  <div className="font-bold text-sm">{u.name}</div>
                  <div className="text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                      u.role === 'admin'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={u.id === currentUserId || busyId === u.id}
                      onClick={() => setDeleteTarget(u)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xoá
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-slate-500">
                  Không có user.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void submitForm(e)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-3 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold">
                {modal === 'create' ? 'Thêm account mới' : 'Sửa account'}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Tên
              </span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Email đăng nhập
              </span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                {modal === 'create'
                  ? 'Mật khẩu (≥ 8 ký tự)'
                  : 'Mật khẩu mới (để trống nếu giữ nguyên)'}
              </span>
              <input
                type="password"
                autoComplete="new-password"
                required={modal === 'create'}
                minLength={modal === 'create' ? 8 : undefined}
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-500">
                Role
              </span>
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    role: e.target.value as 'user' | 'admin',
                  }))
                }
                disabled={editing?.id === currentUserId && form.role === 'admin'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm outline-none"
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-60"
              >
                {saving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[85] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-extrabold">Xoá account?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Xoá hẳn tài khoản{' '}
              <strong className="text-slate-800 dark:text-slate-200">
                {deleteTarget.email}
              </strong>{' '}
              khỏi hệ thống. Không thể hoàn tác.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold"
              >
                Huỷ
              </button>
              <button
                type="button"
                disabled={busyId === deleteTarget.id}
                onClick={() => void confirmDelete()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold disabled:opacity-60"
              >
                Xoá hẳn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
