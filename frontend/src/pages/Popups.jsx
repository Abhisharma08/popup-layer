import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { EMBED_URL, API_URL } from '../api/client';

export default function Popups() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [tab, setTab] = useState('active');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  async function fetchPopups() {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      const { data } = await client.get('/popups', { params: { workspaceId } });
      setPopups(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(fetchPopups);
  }, []);

  const updateStatus = async (popupId, newStatus) => {
    try {
      await client.patch(`/popups/${popupId}/status`, { status: newStatus });
      fetchPopups();
      const labels = { ACTIVE: 'activated', PAUSED: 'paused', ARCHIVED: 'archived', DRAFT: 'moved to draft' };
      showToast(`Popup ${labels[newStatus] || 'updated'} successfully.`);
    } catch (e) {
      console.error(e);
      showToast('Network error.', 'error');
    }
  };

  const deletePopup = async (popupId) => {
    if (!window.confirm('Are you sure you want to permanently delete this popup? This cannot be undone.')) return;
    try {
      await client.delete(`/popups/${popupId}`);
      fetchPopups();
      showToast('Popup deleted permanently.');
    } catch (e) {
      console.error(e);
      showToast('Failed to delete popup.', 'error');
    }
  };

  const getEmbedCode = (popup) => {
    const separator = EMBED_URL.includes('?') ? '&' : '?';
    const version = popup.updatedAt ? new Date(popup.updatedAt).getTime() : Date.now();
    const src = `${EMBED_URL}${separator}v=${version}&popupId=${encodeURIComponent(popup.id)}&apiUrl=${encodeURIComponent(API_URL)}`;
    return `<script src="${src}" data-api-url="${API_URL}" data-popup-id="${popup.id}"></script>`;
  };

  const copyEmbedCode = async (popup) => {
    await navigator.clipboard.writeText(getEmbedCode(popup));
    setCopiedId(popup.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activePopups = popups.filter(p => p.status !== 'ARCHIVED');
  const archivedPopups = popups.filter(p => p.status === 'ARCHIVED');
  const displayedPopups = tab === 'active' ? activePopups : archivedPopups;

  if (loading) return <div className="pl-page text-sm text-slate-500">Loading popups...</div>;

  return (
    <div className="pl-page">
      {toast && (
        <div className={`fixed right-4 top-4 z-50 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
          toast.type === 'success' ? 'bg-teal-700' : 'bg-orange-700'
        }`}>
          {toast.message}
        </div>
      )}

      <div className="pl-page-header">
        <div>
          <div className="pl-kicker">Campaign Library</div>
          <h1 className="pl-page-title mt-4">Manage what is live, what is parked, and what gets embedded next.</h1>
          <p className="pl-page-copy">
            Each popup carries its own embed code, status, and edit path so you can work campaign by campaign without guesswork.
          </p>
        </div>
        <Link to="/popups/new" className="pl-button">
          Create popup
        </Link>
      </div>

      <div className="mb-6 inline-flex rounded-2xl border border-black/5 bg-white/70 p-1.5 shadow-sm">
        <button
          onClick={() => setTab('active')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'active' ? 'bg-slate-900 text-white' : 'text-slate-500'
          }`}
        >
          Active ({activePopups.length})
        </button>
        <button
          onClick={() => setTab('archived')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            tab === 'archived' ? 'bg-slate-900 text-white' : 'text-slate-500'
          }`}
        >
          Archived ({archivedPopups.length})
        </button>
      </div>

      {displayedPopups.length === 0 ? (
        <div className="pl-surface pl-empty rounded-[26px]">
          {tab === 'active' ? 'No active popups yet. Create one to start collecting leads.' : 'No archived popups yet.'}
        </div>
      ) : (
        <div className="space-y-5">
          {displayedPopups.map(popup => (
            <div key={popup.id} className="pl-surface pl-panel rounded-[26px]">
              <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-900">{popup.name}</h3>
                    <span className={`pl-badge ${
                      popup.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : popup.status === 'PAUSED'
                          ? 'bg-amber-100 text-amber-700'
                          : popup.status === 'ARCHIVED'
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-sky-100 text-sky-700'
                    }`}>
                      {popup.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <span className="capitalize">{popup.type.replaceAll('_', ' ').toLowerCase()}</span>
                    <span>{new Date(popup.createdAt).toLocaleDateString()}</span>
                    <span>Updated {new Date(popup.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tab === 'active' && (
                    <button
                      onClick={() => updateStatus(popup.id, popup.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                      className="pl-button pl-button-secondary"
                    >
                      {popup.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  )}
                  <Link to={`/popups/${popup.id}/edit`} className="pl-button pl-button-secondary">
                    Edit
                  </Link>
                  <Link to={`/leads?popupId=${popup.id}`} className="pl-button pl-button-secondary">
                    Leads
                  </Link>
                  {tab === 'active' ? (
                    <button onClick={() => updateStatus(popup.id, 'ARCHIVED')} className="pl-button pl-button-ghost">
                      Archive
                    </button>
                  ) : (
                    <>
                      <button onClick={() => updateStatus(popup.id, 'DRAFT')} className="pl-button pl-button-secondary">
                        Unarchive
                      </button>
                      <button onClick={() => deletePopup(popup.id)} className="pl-button pl-button-ghost">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {tab === 'active' && (
                <div className="border-t border-black/5 px-5 py-5">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-slate-400">Embed snippet</div>
                  <div className="flex flex-col gap-3 rounded-[20px] bg-[#17202a] p-4 lg:flex-row lg:items-center">
                    <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap text-xs text-emerald-300">
                      {getEmbedCode(popup)}
                    </code>
                    <button
                      onClick={() => copyEmbedCode(popup)}
                      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                        copiedId === popup.id ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {copiedId === popup.id ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
