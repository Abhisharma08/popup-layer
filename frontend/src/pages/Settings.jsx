import { useEffect, useState } from 'react';
import client from '../api/client';

export default function Settings() {
  const [members, setMembers] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState('');
  const [error, setError] = useState('');
  const [domainError, setDomainError] = useState('');

  async function fetchSettings() {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      const [membersRes, domainsRes] = await Promise.all([
        client.get(`/workspaces/${workspaceId}/members`),
        client.get(`/workspaces/${workspaceId}/domains`),
      ]);
      setMembers(membersRes.data);
      setDomains(domainsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(fetchSettings);
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      await client.post(`/workspaces/${workspaceId}/members`, { email, role: 'MEMBER' });
      setEmail('');
      fetchSettings();
    } catch (requestError) {
      console.error(requestError);
      setError(requestError.response?.data?.error || 'Failed to add member');
    }
  };

  const handleAddDomain = async (e) => {
    e.preventDefault();
    if (!domain) return;
    setDomainError('');
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      await client.post(`/workspaces/${workspaceId}/domains`, { domain });
      setDomain('');
      fetchSettings();
    } catch (requestError) {
      console.error(requestError);
      setDomainError(requestError.response?.data?.error || 'Failed to add domain');
    }
  };

  const handleDeleteDomain = async (domainId) => {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      await client.delete(`/workspaces/${workspaceId}/domains/${domainId}`);
      fetchSettings();
    } catch (requestError) {
      console.error(requestError);
      setDomainError(requestError.response?.data?.error || 'Failed to remove domain');
    }
  };

  if (loading) return <div className="pl-page text-sm text-slate-500">Loading settings...</div>;

  return (
    <div className="pl-page">
      <div className="pl-page-header">
        <div>
          <div className="pl-kicker">Workspace Controls</div>
          <h1 className="pl-page-title mt-4">Manage who can work here and where public submissions are allowed to come from.</h1>
          <p className="pl-page-copy">
            Domains tighten public ingestion rules. Team membership keeps ownership clear while your workspace starts growing.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="pl-surface pl-panel rounded-[26px]">
          <div className="pl-panel-header">
            <div>
              <div className="pl-panel-title">Allowed domains</div>
              <div className="pl-panel-copy">Only configured domains should send public lead and analytics traffic once you are ready to enforce them.</div>
            </div>
          </div>

          <div className="p-5">
            <form onSubmit={handleAddDomain} className="grid gap-3 md:grid-cols-[1fr,auto]">
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="example.com"
                className="pl-field"
                required
              />
              <button type="submit" className="pl-button">Add domain</button>
            </form>

            {domainError && (
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                {domainError}
              </div>
            )}

            <div className="mt-5">
              {domains.length === 0 ? (
                <div className="rounded-[22px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
                  No domains configured yet. Public submissions are still allowed for compatibility while you finish setup.
                </div>
              ) : (
                <div className="space-y-3">
                  {domains.map(item => (
                    <div key={item.id} className="flex flex-col gap-3 rounded-[22px] border border-black/5 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-semibold text-slate-900">{item.domain}</div>
                        <div className="mt-1 text-sm text-slate-500">{item.verified ? 'Verified and active' : 'Pending verification'}</div>
                      </div>
                      <button onClick={() => handleDeleteDomain(item.id)} className="pl-button pl-button-secondary">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pl-surface pl-panel rounded-[26px]">
          <div className="pl-panel-header">
            <div>
              <div className="pl-panel-title">Team members</div>
              <div className="pl-panel-copy">Invite collaborators and keep roles visible without needing to cross-reference IDs.</div>
            </div>
          </div>

          <div className="p-5">
            <form onSubmit={handleInvite} className="grid gap-3 md:grid-cols-[1fr,auto]">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="pl-field"
                required
              />
              <button type="submit" className="pl-button">Invite member</button>
            </form>

            {error && (
              <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-700">
                {error}
              </div>
            )}

            <div className="mt-5 space-y-3">
              {members.length === 0 ? (
                <div className="rounded-[22px] border border-black/5 bg-white/80 px-4 py-4 text-sm text-slate-500">
                  No members found.
                </div>
              ) : (
                members.map(member => (
                  <div key={member.id} className="flex flex-col gap-3 rounded-[22px] border border-black/5 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-slate-900">{member.user?.email || member.userId}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {member.user?.name || 'No display name'} · Joined {new Date(member.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="pl-badge bg-slate-200 text-slate-700">{member.role}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
