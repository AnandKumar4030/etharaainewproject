import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi, tasksApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import KanbanView from '../components/KanbanView';
import {
  FolderKanban, Plus, Users, Trash2, Edit2, X, AlertCircle,
  ChevronLeft, UserPlus, Clock, Calendar, Flag, List, LayoutGrid
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];
const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const statusBadge = { todo: 'badge-todo', in_progress: 'badge-in_progress', done: 'badge-done' };
const statusLabel = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' };
const priorityBadge = { low: 'badge-low', medium: 'badge-medium', high: 'badge-high' };
const priorityLabel = { low: 'Low', medium: 'Medium', high: 'High' };

function TaskModal({ task, project, members, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!task;
  const isAdmin = project?.myRole === 'admin';

  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assigneeId: task?.assigneeId || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      };
      if (isEdit) {
        const { data } = await tasksApi.update(task.id, payload);
        onSaved(data, 'update');
      } else {
        const { data } = await tasksApi.create(project.id, payload);
        onSaved(data, 'create');
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="card w-full max-w-lg my-4 animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-100" style={{ color: 'var(--text-1)' }}>{isEdit ? 'Edit Task' : 'Create Task'}</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-400 px-3 py-2.5 rounded-lg mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isAdmin && (
            <>
              <div>
                <label className="label" htmlFor="task-title">Title *</label>
                <input id="task-title" className="input" required placeholder="Task title"
                  value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label className="label" htmlFor="task-desc">Description</label>
                <textarea id="task-desc" className="input resize-none" rows={2} placeholder="Optional details..."
                  value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="task-priority">Priority</label>
                  <select id="task-priority" className="input"
                    value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}>
                    {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="task-assignee">Assign to</label>
                  <select id="task-assignee" className="input"
                    value={form.assigneeId} onChange={(e) => setForm((p) => ({ ...p, assigneeId: e.target.value }))}>
                    <option value="">Unassigned</option>
                    {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="task-due">Due Date</label>
                <input id="task-due" type="date" className="input"
                  value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </>
          )}
          <div>
            <label className="label" htmlFor="task-status">Status</label>
            <select id="task-status" className="input"
              value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Task')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [form, setForm] = useState({ email: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await projectsApi.addMember(projectId, form);
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-sm animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-100" style={{ color: 'var(--text-1)' }}>Add Member</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-400 px-3 py-2.5 rounded-lg mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="member-email">Email address</label>
            <input id="member-email" type="email" required className="input" placeholder="user@example.com"
              value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="member-role">Role</label>
            <select id="member-role" className="input"
              value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('tasks');
  const [viewMode, setViewMode] = useState('board'); // 'list' | 'board'
  const [taskModal, setTaskModal] = useState(null); // null | 'create' | task object
  const [showAddMember, setShowAddMember] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    projectsApi.get(id)
      .then((res) => setProject(res.data))
      .catch(() => navigate('/projects'))
      .finally(() => setLoading(false));
  }, [id]);

  const isAdmin = project?.myRole === 'admin';

  const handleTaskSaved = (savedTask, action) => {
    setProject((p) => ({
      ...p,
      tasks: action === 'create'
        ? [savedTask, ...p.tasks]
        : p.tasks.map((t) => (t.id === savedTask.id ? savedTask : t)),
    }));
  };

  const handleTaskStatusChange = (updatedTask) => {
    setProject((p) => ({
      ...p,
      tasks: p.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await tasksApi.delete(taskId);
      setProject((p) => ({ ...p, tasks: p.tasks.filter((t) => t.id !== taskId) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Remove this member?')) return;
    try {
      await projectsApi.removeMember(id, memberId);
      setProject((p) => ({ ...p, members: p.members.filter((m) => m.id !== memberId) }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this entire project? This cannot be undone.')) return;
    try {
      await projectsApi.delete(id);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  const filteredTasks = (project?.tasks || []).filter((t) =>
    filterStatus === 'all' ? true : t.status === filterStatus
  );

  const taskCounts = (project?.tasks || []).reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 rounded w-48" style={{ background: 'var(--surface-3)' }} />
        <div className="h-4 rounded w-72" style={{ background: 'var(--surface-3)' }} />
        <div className="h-64 rounded-xl mt-6" style={{ background: 'var(--surface-3)' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {taskModal !== null && (
        <TaskModal
          task={taskModal === 'create' ? null : taskModal}
          project={project}
          members={project?.members || []}
          onClose={() => setTaskModal(null)}
          onSaved={handleTaskSaved}
        />
      )}
      {showAddMember && (
        <AddMemberModal
          projectId={id}
          onClose={() => setShowAddMember(false)}
          onAdded={(m) => setProject((p) => ({ ...p, members: [...p.members, m] }))}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm hover:text-gray-300 mb-3 transition-colors"
          style={{ color: 'var(--text-3)' }}
        >
          <ChevronLeft className="w-4 h-4" /> Back to Projects
        </button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FolderKanban className="w-5 h-5 text-brand-400" />
              <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Project</span>
              {isAdmin && <span className="badge bg-brand-900/40 text-brand-400 border border-brand-800/40">Admin</span>}
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{project?.name}</h1>
            {project?.description && (
              <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>{project.description}</p>
            )}
          </div>
          {isAdmin && (
            <button onClick={handleDeleteProject} className="btn-danger btn-sm flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>

        {/* Task status summary */}
        <div className="flex gap-3 mt-4">
          {[
            { status: 'todo', count: taskCounts.todo || 0, color: 'text-gray-400', bg: 'var(--surface-2)' },
            { status: 'in_progress', count: taskCounts.in_progress || 0, color: 'text-blue-400', bg: 'rgba(59, 130, 246, 0.1)' },
            { status: 'done', count: taskCounts.done || 0, color: 'text-green-400', bg: 'rgba(34, 197, 94, 0.1)' },
          ].map(({ status, count, color, bg }) => (
            <div key={status} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${color}`} style={{ background: bg }}>
              {statusLabel[status]}: {count}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg border w-fit mb-6" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
        {['tasks', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all duration-200 ${
              activeTab === tab ? 'bg-brand-600 text-white shadow' : 'hover:text-brand-400'
            }`}
            style={activeTab !== tab ? { color: 'var(--text-2)' } : {}}
          >
            {tab} {tab === 'tasks' ? `(${project?.tasks?.length || 0})` : `(${project?.members?.length || 0})`}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button id="create-task-btn" onClick={() => setTaskModal('create')} className="btn-primary btn-sm">
                  <Plus className="w-3.5 h-3.5" /> New Task
                </button>
              )}
              {viewMode === 'list' && (
                <div className="flex gap-1">
                  {['all', 'todo', 'in_progress', 'done'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFilterStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                        filterStatus === s ? 'text-gray-100' : 'hover:text-gray-400'
                      }`}
                      style={{ background: filterStatus === s ? 'var(--surface-3)' : 'transparent', color: filterStatus === s ? 'var(--text-1)' : 'var(--text-2)' }}
                    >
                      {s === 'all' ? 'All' : statusLabel[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-surface-2 p-1 rounded-lg border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
              <button
                onClick={() => setViewMode('board')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'board' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                style={viewMode !== 'board' ? { color: 'var(--text-2)' } : {}}
                title="Board View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-brand-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                style={viewMode !== 'list' ? { color: 'var(--text-2)' } : {}}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {viewMode === 'board' ? (
             <KanbanView
              tasks={project?.tasks || []}
              isAdmin={isAdmin}
              onEdit={setTaskModal}
              onDelete={handleDeleteTask}
              onCreateInColumn={(status) => setTaskModal({ status, priority: 'medium' })}
              onStatusChange={handleTaskStatusChange}
            />
          ) : (
            <div className="space-y-2">
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12 text-gray-600">
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p style={{ color: 'var(--text-2)' }}>{filterStatus === 'all' ? 'No tasks yet' : `No ${statusLabel[filterStatus]} tasks`}</p>
                  {isAdmin && filterStatus === 'all' && (
                    <button onClick={() => setTaskModal('create')} className="btn-primary mt-3">
                      <Plus className="w-4 h-4" /> Create first task
                    </button>
                  )}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="card-sm flex items-start gap-4 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`badge ${statusBadge[task.status]}`}>{statusLabel[task.status]}</span>
                        <span className={`badge ${priorityBadge[task.priority]}`}>
                          <Flag className="w-2.5 h-2.5 mr-0.5" />{priorityLabel[task.priority]}
                        </span>
                      </div>
                      <p className="font-medium mt-1.5 truncate" style={{ color: 'var(--text-1)' }}>{task.title}</p>
                      {task.description && (
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-3)' }}>{task.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--text-3)' }}>
                        {task.assigneeName && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {task.assigneeName}
                          </span>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <button
                        onClick={() => setTaskModal(task)}
                        className="btn-ghost p-1.5 rounded-md"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-ghost p-1.5 rounded-md text-red-500 hover:text-red-400"
                          style={{ ':hover': { background: 'rgba(239, 68, 68, 0.1)' } }}
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          {isAdmin && (
            <button onClick={() => setShowAddMember(true)} className="btn-primary btn-sm mb-4">
              <UserPlus className="w-3.5 h-3.5" /> Add Member
            </button>
          )}
          <div className="space-y-2">
            {(project?.members || []).map((member) => (
              <div
                key={member.id}
                className="card-sm flex items-center gap-4 transition-colors"
                style={{ border: '1px solid transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                <div className="w-9 h-9 rounded-full bg-brand-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-400 text-sm font-bold">{member.name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm" style={{ color: 'var(--text-1)' }}>{member.name}</p>
                  <p className="text-xs" style={{ color: 'var(--text-3)' }}>{member.email}</p>
                </div>
                <span className={`text-xs font-semibold capitalize ${member.role === 'admin' ? 'text-brand-400' : ''}`} style={member.role !== 'admin' ? { color: 'var(--text-2)' } : {}}>
                  {member.role}
                </span>
                {isAdmin && member.id !== user?.id && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="btn-ghost p-1.5 rounded-md text-red-500 hover:text-red-400"
                    style={{ ':hover': { background: 'rgba(239, 68, 68, 0.1)' } }}
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
