import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { FolderKanban, Plus, Search, Users, CheckSquare, X, AlertCircle } from 'lucide-react';

function CreateProjectModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await projectsApi.create(form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-100">New Project</h2>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-400 px-3 py-2.5 rounded-lg mb-4 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label" htmlFor="proj-name">Project name *</label>
            <input
              id="proj-name"
              className="input"
              placeholder="My awesome project"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label" htmlFor="proj-desc">Description</label>
            <textarea
              id="proj-desc"
              className="input resize-none"
              rows={3}
              placeholder="What is this project about?"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    projectsApi.list()
      .then((res) => setProjects(res.data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = { admin: 'text-brand-400', member: 'text-gray-500' };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 rounded w-36" style={{ background: 'var(--surface-3)' }} />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-44 rounded-xl" style={{ background: 'var(--surface-3)' }} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => setProjects((prev) => [p, ...prev])}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderKanban className="w-5 h-5 text-brand-400" />
            <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Projects</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
            {user?.role === 'superadmin' ? 'All Projects' : 'My Projects'}
          </h1>
        </div>
        <button
          id="create-project-btn"
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-3)' }} />
        <input
          className="input pl-9"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-2)' }}>
          <FolderKanban className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{search ? 'No projects match your search' : 'No projects yet'}</p>
          {!search && (
            <button onClick={() => setShowCreate(true)} className="btn-primary mt-4">
              <Plus className="w-4 h-4" /> Create your first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="card transition-all duration-200 group block hover:shadow-2xl"
              style={{ borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-800/40 flex items-center justify-center">
                  <FolderKanban className="w-5 h-5 text-brand-400" />
                </div>
                <span className="text-xs font-semibold capitalize" style={{ color: project.myRole === 'admin' ? 'var(--brand-400)' : 'var(--text-3)' }}>
                  {project.myRole}
                </span>
              </div>
              <h3 className="font-semibold transition-colors mb-1 truncate" style={{ color: 'var(--text-1)' }}>
                {project.name}
              </h3>
              <p className="text-sm line-clamp-2 mb-4 min-h-[2.5rem]" style={{ color: 'var(--text-2)' }}>
                {project.description || 'No description provided'}
              </p>
              <div className="flex items-center gap-4 text-xs pt-3" style={{ color: 'var(--text-3)', borderTop: '1px solid var(--border)' }}>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  {project.memberCount} {project.memberCount === 1 ? 'member' : 'members'}
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  {project.taskCount} {project.taskCount === 1 ? 'task' : 'tasks'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
