import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  Activity,
  Settings,
  LogOut,
} from 'lucide-react';

import { useAuthStore } from '../../stores/useAuthStore.js';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'New Scan', path: '/scans/new', icon: Shield },
  { name: 'Scan History', path: '/scans/history', icon: Activity },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/') {
      return 'Dashboard';
    }

    const currentPage = navItems.find(
      (item) => item.path === location.pathname
    );

    return currentPage?.name || 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-background text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-surface border-r border-border flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2 text-accent">
            <Shield className="w-6 h-6" />
            <span className="font-bold text-lg text-primary tracking-wide">
              AI Engine
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                  isActive
                    ? 'bg-surfaceHover text-primary font-medium'
                    : 'text-muted hover:bg-surfaceHover/50 hover:text-primary'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/50 flex items-center justify-center text-accent font-bold text-sm shrink-0">
              {userInitial}
            </div>

            <div className="text-sm truncate pr-2">
              <p className="font-medium text-primary truncate">
                {user?.name || 'User'}
              </p>

              <p className="text-muted text-xs capitalize">
                {user?.role?.toLowerCase() || 'Engineer'}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10 px-8 flex items-center">
          <h1 className="text-lg font-medium text-primary">
            {getPageTitle()}
          </h1>
        </header>

        <div className="p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};