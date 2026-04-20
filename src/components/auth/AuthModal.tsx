import { useState } from 'react';
import type { AuthPayload } from '../../lib/auth';

export function AuthModal({
  mode,
  onClose,
  onSubmit,
}: {
  mode: 'login' | 'register';
  onClose: () => void;
  onSubmit: (payload: AuthPayload) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const title = mode === 'login' ? '登录' : '注册';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl text-brand-900">{title}</h2>
          <button onClick={onClose} className="text-sm text-brand-500">
            关闭
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setSubmitting(true);
            setError('');
            try {
              await onSubmit({ email, password });
              onClose();
            } catch (submitError) {
              setError(submitError instanceof Error ? submitError.message : '提交失败');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          <label className="block text-sm text-brand-700">
            邮箱
            <input
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-3"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block text-sm text-brand-700">
            密码
            <input
              className="mt-1 w-full rounded-xl border border-brand-200 px-4 py-3"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-brand-900 px-4 py-3 text-brand-50"
          >
            {submitting ? '提交中...' : title}
          </button>
        </form>
      </div>
    </div>
  );
}
