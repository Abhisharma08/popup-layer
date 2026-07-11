import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import client from '../api/client';

export default function Leads() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [popups, setPopups] = useState([]);
  const [leads, setLeads] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loadingPopups, setLoadingPopups] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const selectedPopupId = searchParams.get('popupId');

  const fetchPopups = useCallback(async () => {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      const { data } = await client.get('/popups', { params: { workspaceId } });
      const activePopups = data.filter(p => p.status === 'ACTIVE');
      setPopups(activePopups);
      
      // Auto-select the first popup if none is selected and there are active popups
      if (!selectedPopupId && activePopups.length > 0) {
        setSearchParams({ popupId: activePopups[0].id }, { replace: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPopups(false);
    }
  }, [selectedPopupId, setSearchParams]);

  useEffect(() => {
    queueMicrotask(fetchPopups);
  }, [fetchPopups]);

  const fetchLeads = useCallback(async () => {
    if (!selectedPopupId) {
      setLeads([]);
      setDeliveries([]);
      return;
    }
    setLoadingLeads(true);
    try {
      const [leadsRes, deliveriesRes] = await Promise.all([
        client.get('/leads', { params: { popupId: selectedPopupId } }),
        client.get('/leads/webhook-deliveries', { params: { popupId: selectedPopupId, limit: 10 } }),
      ]);
      setLeads(leadsRes.data);
      setDeliveries(deliveriesRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingLeads(false);
    }
  }, [selectedPopupId]);

  useEffect(() => {
    if (selectedPopupId) {
      queueMicrotask(fetchLeads);
    }
  }, [fetchLeads, selectedPopupId]);

  const handleExportCSV = async () => {
    if (!selectedPopupId) return;
    try {
      const res = await client.get('/leads/export', {
        params: { popupId: selectedPopupId },
        responseType: 'blob',
      });
      const blob = res.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-${selectedPopupId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error(e);
      alert('Error exporting CSV');
    }
  };

  const handleRetryWebhook = async (deliveryId) => {
    setRetryingId(deliveryId);
    try {
      await client.post(`/leads/webhook-deliveries/${deliveryId}/retry`);
      fetchLeads();
    } catch (e) {
      console.error(e);
      alert('Error retrying webhook');
    } finally {
      setRetryingId(null);
    }
  };

  const handlePopupChange = (e) => {
    setSearchParams({ popupId: e.target.value });
  };

  if (loadingPopups) return <div className="pl-page text-sm text-slate-500">Loading workspaces...</div>;

  const customKeys = new Set();
  leads.forEach(lead => {
    if (!lead.customData) return;
    try {
      const parsed = JSON.parse(lead.customData);
      Object.keys(parsed).forEach(key => customKeys.add(key));
    } catch {}
  });
  const customKeysArray = Array.from(customKeys);

  return (
    <div className="pl-page">
      <div className="pl-page-header">
        <div>
          <h1 className="pl-page-title">Workspace Leads</h1>
          <p className="pl-page-copy">
            Select an active popup to review captured submissions, inspect source pages, and check webhook deliveries.
          </p>
        </div>
        {leads.length > 0 && (
          <button onClick={handleExportCSV} className="pl-button pl-button-secondary">
            Export CSV
          </button>
        )}
      </div>

      <div className="mb-8">
        <label htmlFor="popup-select" className="block text-sm font-semibold text-slate-700 mb-2">
          Select Active Popup
        </label>
        <select
          id="popup-select"
          value={selectedPopupId || ''}
          onChange={handlePopupChange}
          className="pl-field max-w-md"
        >
          {popups.length === 0 && <option value="" disabled>No active popups found</option>}
          {popups.length > 0 && !selectedPopupId && <option value="" disabled>Select a popup...</option>}
          {popups.map(popup => (
            <option key={popup.id} value={popup.id}>
              {popup.name}
            </option>
          ))}
        </select>
      </div>

      {loadingLeads ? (
        <div className="text-sm text-slate-500">Loading leads...</div>
      ) : selectedPopupId ? (
        <div className="space-y-6">
          {deliveries.length > 0 && (
            <div className="pl-surface pl-panel rounded-[26px]">
              <div className="pl-panel-header">
                <div>
                  <div className="pl-panel-title">Recent webhook deliveries</div>
                  <div className="pl-panel-copy">Keep an eye on integrations that need a manual retry or a closer look.</div>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {deliveries.map(delivery => (
                  <div key={delivery.id} className="flex flex-col gap-4 rounded-[22px] border border-black/5 bg-white/80 p-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{delivery.url}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {new Date(delivery.createdAt).toLocaleString()}
                        {delivery.statusCode ? ` · HTTP ${delivery.statusCode}` : ''}
                        {delivery.attempts ? ` · Attempt ${delivery.attempts}` : ''}
                      </div>
                      {delivery.lead?.email && <div className="mt-2 text-sm text-slate-600">{delivery.lead.email}</div>}
                      {delivery.lastError && <div className="mt-2 text-sm text-orange-700">{delivery.lastError}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`pl-badge ${
                        delivery.status === 'SUCCESS'
                          ? 'bg-emerald-100 text-emerald-700'
                          : delivery.status === 'FAILED'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {delivery.status}
                      </span>
                      {delivery.status === 'FAILED' && (
                        <button
                          onClick={() => handleRetryWebhook(delivery.id)}
                          disabled={retryingId === delivery.id}
                          className="pl-button pl-button-secondary"
                        >
                          {retryingId === delivery.id ? 'Retrying...' : 'Retry'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leads.length === 0 ? (
            <div className="pl-surface pl-empty rounded-[26px]">
              No leads captured yet for this popup.
            </div>
          ) : (
            <div className="pl-surface pl-panel rounded-[26px]">
              <div className="pl-panel-header">
                <div>
                  <div className="pl-panel-title">Captured leads</div>
                  <div className="pl-panel-copy">Everything submitted through this popup, including custom form fields.</div>
                </div>
              </div>
              <div className="pl-table-wrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Name</th>
                      <th>Phone</th>
                      {customKeysArray.map(key => (
                        <th key={key}>{key.replace(/_/g, ' ')}</th>
                      ))}
                      <th>Source URL</th>
                      <th>Captured at</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(lead => (
                      <tr key={lead.id}>
                        <td className="font-medium text-slate-900">{lead.email}</td>
                        <td>{lead.name || '-'}</td>
                        <td>{lead.phone || '-'}</td>
                        {customKeysArray.map(key => {
                          let value = '-';
                          if (lead.customData) {
                            try {
                              const parsed = JSON.parse(lead.customData);
                              value = parsed[key] || '-';
                            } catch {
                              value = '-';
                            }
                          }
                          return <td key={key}>{value}</td>;
                        })}
                        <td className="max-w-xs truncate" title={lead.sourceUrl}>{lead.sourceUrl || '-'}</td>
                        <td>{new Date(lead.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="pl-surface pl-empty rounded-[26px]">
          Please select a popup to view its leads.
        </div>
      )}
    </div>
  );
}
