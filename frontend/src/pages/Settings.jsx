import { useState, useEffect } from 'react';

export default function Settings() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const workspaceId = localStorage.getItem('workspaceId') || 'test-workspace';
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return;
    try {
      const workspaceId = localStorage.getItem('workspaceId') || 'test-workspace';
      const res = await fetch(`http://localhost:4000/api/workspaces/${workspaceId}/members`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ email, role: 'MEMBER' })
      });
      if (res.ok) {
        setEmail('');
        fetchMembers();
      } else {
        alert('Failed to invite member');
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Workspace Settings</h1>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold mb-1">Team Members</h3>
          <p className="text-sm text-gray-500">Manage who has access to this workspace.</p>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleInvite} className="flex gap-4 mb-8">
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="flex-1 px-4 py-2 border rounded focus:ring focus:ring-indigo-200 focus:border-indigo-500"
              required
            />
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded font-medium hover:bg-indigo-700">
              Invite
            </button>
          </form>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500">User ID</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Role</th>
                  <th className="px-6 py-3 font-medium text-gray-500">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {members.map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4">{member.userId}</td>
                    <td className="px-6 py-4">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{new Date(member.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">No members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
