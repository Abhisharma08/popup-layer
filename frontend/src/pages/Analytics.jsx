import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
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

  if (loading) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Analytics Dashboard</h1>

      {stats.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border text-gray-500">
          No data available.
        </div>
      ) : (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500 font-medium mb-1">Total Views</div>
              <div className="text-3xl font-bold">{stats.reduce((acc, curr) => acc + curr.views, 0)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500 font-medium mb-1">Total Submits</div>
              <div className="text-3xl font-bold">{stats.reduce((acc, curr) => acc + curr.submits, 0)}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="text-sm text-gray-500 font-medium mb-1">Average Conversion</div>
              <div className="text-3xl font-bold text-indigo-600">
                {stats.length > 0 
                  ? ((stats.reduce((acc, curr) => acc + curr.submits, 0) / Math.max(1, stats.reduce((acc, curr) => acc + curr.views, 0))) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="font-bold mb-6">Views vs Submits per Popup</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" name="Views" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="submits" name="Submits" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
