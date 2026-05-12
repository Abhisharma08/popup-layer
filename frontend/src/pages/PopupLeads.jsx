import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import client from '../api/client';

export default function PopupLeads() {
  const { id } = useParams();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      const { data } = await client.get('/leads', { params: { popupId: id } });
      setLeads(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(fetchLeads);
  }, [fetchLeads]);

  const handleExportCSV = async () => {
    try {
      const res = await client.get('/leads/export', {
        params: { popupId: id },
        responseType: 'blob'
      });
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Error exporting CSV');
    }
  };

  if (loading) return <div className="p-8">Loading leads...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/popups" className="text-sm text-gray-500 hover:text-indigo-600 mb-2 inline-block">← Back to Popups</Link>
          <h1 className="text-2xl font-bold">Leads</h1>
        </div>
        {leads.length > 0 && (
          <button 
            onClick={handleExportCSV}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-50 shadow-sm"
          >
            Export CSV
          </button>
        )}
      </div>

      {(() => {
        if (leads.length === 0) {
          return (
            <div className="bg-white p-12 text-center rounded-lg shadow-sm border text-gray-500">
              No leads captured yet for this popup.
            </div>
          );
        }

        // Extract custom keys dynamically
        const customKeys = new Set();
        leads.forEach(l => {
          if (l.customData) {
            try {
              const parsed = JSON.parse(l.customData);
              Object.keys(parsed).forEach(k => customKeys.add(k));
            } catch {
              // Ignore malformed custom data from older records.
            }
          }
        });
        const customKeysArray = Array.from(customKeys);

        return (
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Phone</th>
                  {customKeysArray.map(key => (
                    <th key={key} className="px-6 py-4 font-semibold text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </th>
                  ))}
                  <th className="px-6 py-4 font-semibold text-gray-700">Source URL</th>
                  <th className="px-6 py-4 font-semibold text-gray-700">Captured At</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{lead.email}</td>
                    <td className="px-6 py-4 text-gray-500">{lead.name || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{lead.phone || '-'}</td>
                    {customKeysArray.map(key => {
                      let val = '-';
                      if (lead.customData) {
                        try {
                          const parsed = JSON.parse(lead.customData);
                          val = parsed[key] || '-';
                        } catch {
                          val = '-';
                        }
                      }
                      return <td key={key} className="px-6 py-4 text-gray-500">{val}</td>;
                    })}
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={lead.sourceUrl}>{lead.sourceUrl || '-'}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(lead.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </div>
  );
}
