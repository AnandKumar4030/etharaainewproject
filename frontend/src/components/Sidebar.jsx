import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, FolderKanban, CheckSquare,
  Users, LogOut, Zap, Sun, Moon, ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/my-tasks', icon: CheckSquare, label: 'My Tasks' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-60 flex flex-col z-30 border-r"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-1)' }}>TaskFlow</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>Team Task Manager</p>
        </div>
        {/* Theme toggle */}
        <button
          onClick={toggle}
          id="theme-toggle"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="ml-auto p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-yellow-400" />
            : <Moon className="w-4 h-4 text-brand-400" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2" style={{ color: 'var(--text-3)' }}>
          Navigation
        </p>
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
            <ChevronRight className="w-3 h-3 ml-auto opacity-30" />
          </NavLink>
        ))}

        {user?.role === 'superadmin' && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider px-3 mt-4 mb-2" style={{ color: 'var(--text-3)' }}>
              Admin
            </p>
            <NavLink
              to="/admin"
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Users className="w-4 h-4 flex-shrink-0" />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-2"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-1)' }}>{user?.name}</p>
            <p className="text-xs capitalize truncate" style={{ color: 'var(--text-3)' }}>{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="sidebar-link w-full text-red-500 hover:text-red-400">
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
