import { useState, useEffect, useMemo } from 'react';
import { tasksApi } from '../lib/api';
import { CheckSquare, Calendar, Flag, FolderKanban, Clock, Search } from 'lucide-react';

const statusBadge = { todo: 'badge-todo', in_progress: 'badge-in_progress', done: 'badge-done' };
const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityBadge = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];

export default function MyTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    tasksApi.myTasks()
      .then((res) => setTasks(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (taskId, newStatus) => {
    setUpdatingId(taskId);
    try {
      const { data } = await tasksApi.update(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: data.status } : t)));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) || 
                          t.projectName.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [tasks, filterStatus, search]);

  const grouped = useMemo(() => {
    return STATUS_OPTIONS.reduce((acc, s) => {
      acc[s] = tasks.filter((t) => t.status === s).length;
      return acc;
    }, {});
  }, [tasks]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-8 rounded w-32" style={{ background: 'var(--surface-3)' }} />
        {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-xl" style={{ background: 'var(--surface-3)' }} />)}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <CheckSquare className="w-5 h-5 text-brand-400" />
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">My Tasks</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>My Tasks</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>All tasks assigned to you across projects</p>
      </div>

      {/* Stats row & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex gap-3 flex-wrap">
          {STATUS_OPTIONS.map((s) => (
            <div
              key={s}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                filterStatus === s
                  ? 'bg-brand-600/20 border-brand-700 text-brand-400'
                  : 'hover:border-brand-500'
              }`}
              style={filterStatus !== s ? { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-2)' } : {}}
              onClick={() => setFilterStatus(filterStatus === s ? 'all' : s)}
            >
              {statusLabel[s]}: <span className="font-bold">{grouped[s]}</span>
            </div>
          ))}
          {filterStatus !== 'all' && (
            <button onClick={() => setFilterStatus('all')} className="px-4 py-2 rounded-lg text-sm transition-colors hover:text-brand-400" style={{ color: 'var(--text-3)' }}>
              Clear filter
            </button>
          )}
        </div>
        
        <div className="relative max-w-sm w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
          <input
            className="input pl-9"
            placeholder="Search tasks or projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tasks */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-3)' }}>
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium" style={{ color: 'var(--text-2)' }}>
            {search ? 'No tasks match your search' : (filterStatus === 'all' ? "You don't have any assigned tasks" : `No ${statusLabel[filterStatus]} tasks`)}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';
            return (
              <div
                key={task.id}
                className="card-sm flex items-start gap-4 transition-colors hover:shadow-md"
                style={{ borderColor: isOverdue ? 'rgba(239, 68, 68, 0.5)' : 'var(--border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
                    <span className={`badge ${priorityBadge[task.priority]}`}>
                      <Flag className="w-2.5 h-2.5 mr-0.5" /> {priorityLabel[task.priority]}
                    </span>
                    {isOverdue && (
                      <span className="badge bg-red-900/50 text-red-400 border border-red-800/50">Overdue</span>
                    )}
                  </div>
                  <p className="font-medium" style={{ color: 'var(--text-1)' }}>{task.title}</p>
                  {task.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span className="flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" /> {task.projectName}
                    </span>
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick status update */}
                <div className="flex-shrink-0">
                  <select
                    className="input text-xs py-1.5 w-36"
                    value={task.status}
                    disabled={updatingId === task.id}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{statusLabel[s]}</option>
                    ))}
                  </select>
                  {updatingId === task.id && (
                    <div className="flex items-center justify-center mt-1">
                      <span className="w-3 h-3 border border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
