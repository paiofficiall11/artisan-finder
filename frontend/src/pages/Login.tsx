import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';

const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setErrors([]);
    setSubmitting(true);
    try {
      const user = await login(parsed.data.email, parsed.data.password);
      navigate(location.state?.from ?? (user.role === 'artisan' ? '/artisan' : '/client'), {
        replace: true,
      });
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'Login failed']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm animate-scale-in">
        <h1 className="animate-fade-up text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 animate-fade-up text-sm text-slate-500" style={{ animationDelay: '80ms' }}>
          Log in to manage your bookings and profile.
        </p>

        {errors.length > 0 && (
          <div className="mt-4 animate-fade-up rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errors.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 animate-fade-up" style={{ animationDelay: '140ms' }}>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-amber-700 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
