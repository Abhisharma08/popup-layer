import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { EMBED_URL } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ popups: 0, views: 0, leads: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const siteId = localStorage.getItem('siteId') || 'YOUR_SITE_ID';

  async function fetchDashboardData() {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      const [popupsRes, analyticsRes] = await Promise.all([
        client.get('/popups', { params: { workspaceId } }),
        client.get('/analytics', { params: { workspaceId } }),
      ]);

      const popups = popupsRes.data;
      const analytics = analyticsRes.data;

      const totalViews = analytics.reduce((acc, curr) => acc + curr.views, 0);
      const totalSubmits = analytics.reduce((acc, curr) => acc + curr.submits, 0);

      setStats({
        popups: popups.filter(p => p.status === 'ACTIVE').length,
        views: totalViews,
        leads: totalSubmits,
        drafts: popups.filter(p => p.status === 'DRAFT').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(fetchDashboardData);
  }, []);

  const copyScript = async () => {
    const separator = EMBED_URL.includes('?') ? '&' : '?';
    const src = `${EMBED_URL}${separator}siteId=${encodeURIComponent(siteId)}`;
    const script = `<script src="${src}" data-site-id="${siteId}"></script>`;
    await navigator.clipboard.writeText(script);
    setToast('Embed script copied');
    setTimeout(() => setToast(''), 2400);
  };

  if (loading) return <div className="pl-page text-sm text-slate-500">Loading dashboard...</div>;

  return (
    <div className="pl-page">
      {toast && (
        <div className="fixed right-4 top-4 z-50 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="pl-page-header">
        <div>
          <div className="pl-kicker">Workspace overview</div>
          <h1 className="pl-page-title mt-3">See what your campaigns are doing at a glance.</h1>
          <p className="pl-page-copy">
            Keep active popups moving and copy the install snippet when a site is ready.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={copyScript} className="pl-button pl-button-secondary">
            Copy install script
          </button>
          <Link to="/popups/new" className="pl-button">
            Create popup
          </Link>
        </div>
      </div>

      <div className="pl-metric-grid">
        <div className="pl-surface pl-metric-card">
          <div className="pl-metric-label">Active popups</div>
          <div className="pl-metric-value text-slate-900">{stats.popups}</div>
        </div>
        <div className="pl-surface pl-metric-card">
          <div className="pl-metric-label">Total views</div>
          <div className="pl-metric-value text-slate-900">{stats.views}</div>
        </div>
        <div className="pl-surface pl-metric-card">
          <div className="pl-metric-label">Captured leads</div>
          <div className="pl-metric-value text-teal-700">{stats.leads}</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="pl-surface pl-panel">
          <div className="pl-panel-header">
            <div>
              <div className="pl-panel-title">Quick actions</div>
              <div className="pl-panel-copy">Move from idea to live campaign without digging through the app.</div>
            </div>
          </div>
          <div className="grid gap-3 p-5 md:grid-cols-2">
            <Link to="/popups/new" className="rounded-xl border border-black/5 bg-white p-4 transition hover:border-slate-300">
              <div className="text-base font-medium text-slate-900">Launch a new popup</div>
              <div className="mt-1.5 text-sm leading-6 text-slate-500">
                Start from scratch or adapt a template.
              </div>
            </Link>
            <Link to="/popups" className="rounded-xl border border-black/5 bg-white p-4 transition hover:border-slate-300">
              <div className="text-base font-medium text-slate-900">Manage live campaigns</div>
              <div className="mt-1.5 text-sm leading-6 text-slate-500">
                Pause, archive, or inspect existing campaigns.
              </div>
            </Link>
          </div>
        </div>

        <div className="pl-surface pl-panel">
          <div className="pl-panel-header">
            <div>
              <div className="pl-panel-title">Install snapshot</div>
              <div className="pl-panel-copy">Use this workspace snippet on sites that should load all active popups.</div>
            </div>
          </div>
          <div className="space-y-3 p-5">
            <div className="rounded-xl border border-black/5 bg-slate-50 p-4 text-xs text-slate-700">
              <div className="mb-2 font-semibold uppercase tracking-[0.08em] text-slate-500">Site ID</div>
              <code className="block overflow-x-auto whitespace-nowrap">{siteId}</code>
            </div>
            <div className="rounded-xl border border-black/5 bg-white p-4">
              <div className="text-sm font-medium text-slate-900">Draft campaigns waiting</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{stats.drafts}</div>
              <div className="mt-2 text-sm text-slate-500">Drafts stay out of rotation until activated.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
