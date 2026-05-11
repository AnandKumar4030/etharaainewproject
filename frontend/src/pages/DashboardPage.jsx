import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, CheckSquare, Clock, TrendingUp, AlertTriangle,
  FolderKanban, Users, ArrowRight, Circle
} from 'lucide-react';

const statusConfig = {
  todo: { label: 'To Do', className: 'badge-todo' },
  in_progress: { label: 'In Progress', className: 'badge-in_progress' },
  done: { label: 'Done', className: 'badge-done' },
};

const priorityConfig = {
  low: { label: 'Low', className: 'badge-low' },
  medium: { label: 'Medium', className: 'badge-medium' },
  high: { label: 'High', className: 'badge-high' },
};

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="stat-card group cursor-default">
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>{value ?? '—'}</p>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>{label}</p>
        {subtext && <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{subtext}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 rounded w-48" style={{ background: 'var(--surface-3)' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl" style={{ background: 'var(--surface-3)' }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 rounded-xl" style={{ background: 'var(--surface-3)' }} />
          <div className="h-80 rounded-xl" style={{ background: 'var(--surface-3)' }} />
        </div>
      </div>
    );
  }

  const { stats, recentTasks = [], recentProjects = [] } = data || {};
  const isSuperAdmin = user?.role === 'superadmin';

  const statCards = isSuperAdmin
    ? [
        { icon: CheckSquare, label: 'Total Tasks', value: stats?.totalTasks, color: 'accent-brand' },
        { icon: Clock, label: 'In Progress', value: stats?.inProgressTasks, color: 'accent-blue' },
        { icon: TrendingUp, label: 'Completed', value: stats?.doneTasks, color: 'accent-green' },
        { icon: AlertTriangle, label: 'Overdue', value: stats?.overdueTasks, color: 'accent-red' },
        { icon: FolderKanban, label: 'Projects', value: stats?.totalProjects, color: 'accent-purple' },
        { icon: Users, label: 'Users', value: stats?.totalUsers, color: 'accent-orange' },
      ]
    : [
        { icon: FolderKanban, label: 'My Projects', value: stats?.totalProjects, color: 'accent-brand' },
        { icon: CheckSquare, label: 'My Tasks', value: stats?.myTasks, color: 'accent-purple' },
        { icon: Clock, label: 'In Progress', value: stats?.inProgressTasks, color: 'accent-blue' },
        { icon: AlertTriangle, label: 'Overdue', value: stats?.overdueTasks, color: 'accent-red' },
      ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-brand-400" />
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Overview</span>
        </div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-1)' }}>
          Good {getGreeting()}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
          {isSuperAdmin ? "Here's your system overview" : "Here's what's on your plate"}
        </p>
      </div>

      {/* Stat Cards */}
      <div className={`grid grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-3 xl:grid-cols-6' : 'lg:grid-cols-4'} gap-4 mb-8`}>
        {statCards.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Recent Tasks</h2>
            <Link to="/my-tasks" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentTasks.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-2)' }}>No tasks yet</p>
            ) : (
              recentTasks.map((task) => (
                <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg transition-colors hover:shadow-sm border border-transparent hover:border-brand-500/30" style={{ background: 'var(--surface-2)' }}>
                  <Circle className="w-3 h-3 mt-1 flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{task.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{task.projectName}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={statusConfig[task.status]?.className || 'badge'}>
                      {statusConfig[task.status]?.label}
                    </span>
                    <span className={priorityConfig[task.priority]?.className || 'badge'}>
                      {priorityConfig[task.priority]?.label}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold" style={{ color: 'var(--text-1)' }}>Recent Projects</h2>
            <Link to="/projects" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-sm text-center py-6" style={{ color: 'var(--text-2)' }}>No projects yet</p>
            ) : (
              recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg transition-colors group hover:shadow-sm border border-transparent hover:border-brand-500/30"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <div className="w-9 h-9 rounded-lg bg-brand-600/20 border border-brand-800/40 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-4 h-4 text-brand-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate group-hover:text-brand-500 transition-colors" style={{ color: 'var(--text-1)' }}>{project.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{project.taskCount} tasks · {project.ownerName}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 group-hover:text-brand-400 transition-colors flex-shrink-0" style={{ color: 'var(--text-3)' }} />
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
