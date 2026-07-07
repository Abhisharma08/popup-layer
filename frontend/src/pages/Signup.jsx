import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import client from '../api/client';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await client.post('/auth/signup', { email, password, workspaceName });
      login(data.user, data.token);
      localStorage.setItem('workspaceId', data.workspaceId);
      localStorage.setItem('siteId', data.siteId);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pl-auth-shell">
      <section className="pl-auth-hero">
        <div>
          <div className="mb-2 inline-block rounded-lg bg-white p-2">
            <img src="https://res.cloudinary.com/ddqqlfsjp/image/upload/v1783415005/Screenshot_2026-07-07_at_2.30.36_PM_ss7o0b.png" alt="PopLayer" className="h-8" />
          </div>
          <h1 className="mt-6 max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Build the first workspace, wire the first site, and keep the whole funnel visible from day one.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-white/72">
            The account you create here becomes the workspace owner, so you can immediately create popups, add domains, and test embeds.
          </p>
        </div>

        <div className="rounded-[28px] border border-white/12 bg-white/8 p-5">
          <div className="text-sm font-semibold uppercase tracking-[0.12em] text-white/55">What happens next</div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-[20px] bg-white/8 px-4 py-3 text-sm text-white/78">Create a workspace and owner account</div>
            <div className="rounded-[20px] bg-white/8 px-4 py-3 text-sm text-white/78">Design your first popup</div>
            <div className="rounded-[20px] bg-white/8 px-4 py-3 text-sm text-white/78">Copy the embed snippet onto a site</div>
          </div>
        </div>
      </section>

      <section className="pl-surface pl-auth-card">
        <div className="mb-6">
          <div className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-400">Create workspace</div>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Set up your account</h2>
          <p className="mt-2 text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-800">
              Sign in
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Workspace name</label>
            <input
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="pl-field"
              placeholder="Acme Corp"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-field"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-field"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="pl-button w-full"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </section>
    </div>
  );
}
