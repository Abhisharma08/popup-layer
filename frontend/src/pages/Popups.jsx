import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client, { EMBED_URL, API_URL } from '../api/client';

export default function Popups() {
  const [popups, setPopups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [tab, setTab] = useState('active'); // 'active' | 'archived'
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
        const labels = { ACTIVE: 'activated', PAUSED: 'paused', ARCHIVED: 'archived', DRAFT: 'set to draft' };
        showToast(`Popup ${labels[newStatus] || 'updated'} successfully!`);
    } catch (e) {
      console.error(e);
      showToast('Network error.', 'error');
    }
  };

  const archivePopup = (popupId) => updateStatus(popupId, 'ARCHIVED');
  const unarchivePopup = (popupId) => updateStatus(popupId, 'DRAFT');
  const toggleActive = (popup) => updateStatus(popup.id, popup.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');

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
    return `<script src="${EMBED_URL}${separator}v=${version}" data-api-url="${API_URL}" data-popup-id="${popup.id}"></script>`;
  };

  const copyEmbedCode = (popup) => {
    navigator.clipboard.writeText(getEmbedCode(popup));
    setCopiedId(popup.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activePopups = popups.filter(p => p.status !== 'ARCHIVED');
  const archivedPopups = popups.filter(p => p.status === 'ARCHIVED');
  const displayedPopups = tab === 'active' ? activePopups : archivedPopups;

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`} style={{ animation: 'slideDown 0.3s ease-out' }}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Popups</h1>
        <Link to="/popups/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
          + Create Popup
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button 
          onClick={() => setTab('active')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'active' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({activePopups.length})
        </button>
        <button 
          onClick={() => setTab('archived')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            tab === 'archived' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Archived ({archivedPopups.length})
        </button>
      </div>

      {/* Popup List */}
      {displayedPopups.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-xl shadow-sm border text-gray-500">
          {tab === 'active' ? 'No active popups. Create your first popup!' : 'No archived popups.'}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedPopups.map(popup => (
            <div key={popup.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
              {/* Top row */}
              <div className="p-5 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{popup.name}</h3>
                  <div className="text-sm text-gray-500 mt-1 flex gap-3">
                    <span className="capitalize">{popup.type.replace('_', ' ').toLowerCase()}</span>
                    <span>•</span>
                    <span>{new Date(popup.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Status badge */}
                  {tab === 'active' && (
                    <button 
                      onClick={() => toggleActive(popup)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                        popup.status === 'ACTIVE' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 
                        popup.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 
                        'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {popup.status}
                    </button>
                  )}

                  {/* Edit button */}
                  <Link 
                    to={`/popups/${popup.id}/edit`} 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Edit
                  </Link>

                  {/* Leads */}
                  <Link 
                    to={`/popups/${popup.id}/leads`} 
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Leads
                  </Link>

                  {/* Archive / Unarchive */}
                  {tab === 'active' ? (
                    <button 
                      onClick={() => archivePopup(popup.id)}
                      className="text-sm font-medium text-orange-500 hover:text-orange-700 transition-colors"
                    >
                      Archive
                    </button>
                  ) : (
                    <button 
                      onClick={() => unarchivePopup(popup.id)}
                      className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                    >
                      Unarchive
                    </button>
                  )}

                  {tab === 'archived' && (
                    <button 
                      onClick={() => deletePopup(popup.id)}
                      className="text-sm font-medium text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Embed code row */}
              {tab === 'active' && (
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1 pl-4">
                    <code className="flex-1 text-xs text-green-400 font-mono overflow-x-auto whitespace-nowrap py-2">
                      {getEmbedCode(popup)}
                    </code>
                    <button 
                      onClick={() => copyEmbedCode(popup)}
                      className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                        copiedId === popup.id 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {copiedId === popup.id ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast animation */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
