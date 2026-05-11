import { useState, useEffect } from 'react';
import { adminApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Users, Shield, Trash2, AlertCircle, BarChart3, CheckSquare, FolderKanban } from 'lucide-react';

const roleColor = { superadmin: 'text-brand-400', member: 'text-gray-500' };

export default function AdminPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    Promise.all([adminApi.users(), adminApi.stats()])
      .then(([usersRes, statsRes]) => {
        setUsers(usersRes.data);
        setStats(statsRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const { data } = await adminApi.updateRole(userId, newRole);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: data.role } : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This action cannot be undone.')) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 rounded w-36" style={{ background: 'var(--surface-3)' }} />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-28 rounded-xl" style={{ background: 'var(--surface-3)' }} />)}
        </div>
        <div className="h-64 rounded-xl" style={{ background: 'var(--surface-3)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-brand-400" />
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>Admin Panel</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Manage users and view system stats</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Users, label: 'Total Users', value: stats.userCount, color: 'accent-brand' },
            { icon: FolderKanban, label: 'Total Projects', value: stats.projectCount, color: 'accent-purple' },
            { icon: CheckSquare, label: 'Total Tasks', value: stats.taskCount, color: 'accent-blue' },
            { icon: BarChart3, label: 'Completed', value: stats.tasksByStatus?.done || 0, color: 'accent-green' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="stat-card">
              <div className={`p-2 rounded-lg w-fit ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{value}</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users Table */}
      <div className="card">
        <h2 className="font-semibold mb-5" style={{ color: 'var(--text-1)' }}>All Users ({users.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th className="text-left text-xs font-semibold uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-2)' }}>User</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-2)' }}>Role</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-2)' }}>Projects</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider pb-3 pr-4" style={{ color: 'var(--text-2)' }}>Tasks</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--text-2)' }}>Joined</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider pb-3" style={{ color: 'var(--text-2)' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderTop: 'none', borderBottom: 'none' }}>
              {users.map((u) => (
                <tr key={u.id} className="group transition-colors" style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-800/40 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-400 text-xs font-bold">{u.name[0]?.toUpperCase()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate" style={{ color: 'var(--text-1)' }}>{u.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-3)' }}>{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    {u.id === user?.id ? (
                      <span className={`text-xs font-semibold capitalize ${u.role === 'superadmin' ? 'text-brand-400' : ''}`} style={u.role !== 'superadmin' ? { color: 'var(--text-2)' } : {}}>{u.role} (you)</span>
                    ) : (
                      <select
                        className="input text-xs py-1.5 focus:outline-none focus:border-brand-500"
                        value={u.role}
                        disabled={updatingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        style={{ padding: '4px 8px' }}
                      >
                        <option value="member">Member</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    )}
                  </td>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-2)' }}>{u.projectCount}</td>
                  <td className="py-3 pr-4" style={{ color: 'var(--text-2)' }}>{u.taskCount}</td>
                  <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-3)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    {u.id !== user?.id && (
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn-ghost btn-sm text-red-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ ':hover': { background: 'rgba(239, 68, 68, 0.1)' } }}
                        title="Delete user"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
