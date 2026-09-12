import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../shared/api/client';
import { useAuth } from '../../shared/auth/AuthContext';

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@wedecor.events');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/leads" replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await login(email, password);
      navigate('/leads', { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Login failed. Try again.',
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-brand-900">Sign in</h1>
        <p className="mt-1 text-sm text-slate-600">
          We Decor Event OS — Sprint 1
        </p>
        <form className="mt-6 space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              type="email"
              autoComplete="username"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
