import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client, { EMBED_URL } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ popups: 0, views: 0, leads: 0 });
  const [loading, setLoading] = useState(true);
  
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
        leads: totalSubmits
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

  const copyScript = () => {
    const separator = EMBED_URL.includes('?') ? '&' : '?';
    const src = `${EMBED_URL}${separator}siteId=${encodeURIComponent(siteId)}`;
    const script = `<script src="${src}" data-site-id="${siteId}"></script>`;
    navigator.clipboard.writeText(script);
    alert('Embed script copied to clipboard!');
  };

  if (loading) return <div className="p-8">Loading dashboard...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Welcome back! 👋</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Popups</div>
          <div className="text-4xl font-bold text-gray-900">{stats.popups}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Views</div>
          <div className="text-4xl font-bold text-gray-900">{stats.views}</div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Leads</div>
          <div className="text-4xl font-bold text-indigo-600">{stats.leads}</div>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link to="/popups/new" className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group cursor-pointer">
          <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600">Create New Popup →</h3>
          <p className="text-gray-500 text-sm">Design a new popup from scratch or use a template.</p>
        </Link>
        <Link to="/popups" className="flex-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-indigo-300 transition-colors group cursor-pointer">
          <h3 className="font-bold text-lg mb-1 group-hover:text-indigo-600">Manage Popups →</h3>
          <p className="text-gray-500 text-sm">View, pause, or edit your existing campaigns.</p>
        </Link>
      </div>
    </div>
  );
}
