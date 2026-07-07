import { useEffect, useState } from 'react';
import { BarChart, Bar, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import client from '../api/client';

export default function Analytics() {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      const { data } = await client.get('/analytics', { params: { workspaceId } });
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(fetchStats);
  }, []);

  const totalViews = stats.reduce((acc, curr) => acc + curr.views, 0);
  const totalSubmits = stats.reduce((acc, curr) => acc + curr.submits, 0);
  const averageConversion = totalViews > 0 ? ((totalSubmits / totalViews) * 100).toFixed(1) : '0.0';

  if (loading) return <div className="pl-page text-sm text-slate-500">Loading analytics...</div>;

  return (
    <div className="pl-page">
      <div className="pl-page-header">
        <div>
          <div className="pl-kicker">Performance</div>
          <h1 className="pl-page-title mt-4">Track campaign reach and how often visits turn into captured intent.</h1>
          <p className="pl-page-copy">
            The current view is campaign-level and lightweight, which makes it a reliable daily snapshot while we keep building deeper reporting.
          </p>
        </div>
      </div>

      {stats.length === 0 ? (
        <div className="pl-surface pl-empty rounded-[26px]">
          No data available yet. Views and submissions will show up after your first active popup receives traffic.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="pl-metric-grid">
            <div className="pl-surface pl-metric-card">
              <div className="pl-metric-label">Total views</div>
              <div className="pl-metric-value text-slate-900">{totalViews}</div>
            </div>
            <div className="pl-surface pl-metric-card">
              <div className="pl-metric-label">Total submits</div>
              <div className="pl-metric-value text-slate-900">{totalSubmits}</div>
            </div>
            <div className="pl-surface pl-metric-card">
              <div className="pl-metric-label">Average conversion</div>
              <div className="pl-metric-value text-teal-700">{averageConversion}%</div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
            <div className="pl-surface pl-panel rounded-[26px]">
              <div className="pl-panel-header">
                <div>
                  <div className="pl-panel-title">Views vs submits</div>
                  <div className="pl-panel-copy">A quick read on which popups are drawing attention and which ones are converting it.</div>
                </div>
              </div>
              <div className="h-[360px] p-4 sm:p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(31,41,51,0.12)" />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6a7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6a7280' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="views" name="Views" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="submits" name="Submits" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="pl-surface pl-panel rounded-[26px]">
              <div className="pl-panel-header">
                <div>
                  <div className="pl-panel-title">Conversion by popup</div>
                  <div className="pl-panel-copy">Sorted for fast scanning during day-to-day optimization.</div>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {[...stats]
                  .sort((a, b) => Number(b.conversionRate) - Number(a.conversionRate))
                  .map(item => (
                    <div key={item.popupId} className="rounded-[20px] border border-black/5 bg-white/75 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="mt-1 text-sm text-slate-500">
                            {item.views} views · {item.submits} submits
                          </div>
                        </div>
                        <div className="text-lg font-bold text-teal-700">{item.conversionRate}%</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
