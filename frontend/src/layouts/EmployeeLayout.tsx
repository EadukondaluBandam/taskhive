import { ReactNode, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlayCircle,
  CalendarClock,
  Activity,
  TrendingUp,
  User,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmployeeLayoutProps {
  children?: ReactNode;
}

const navItems = [
  { path: '/employee/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/employee/timer', icon: PlayCircle, label: 'Timer' },
  { path: '/employee/timesheets', icon: CalendarClock, label: 'Timesheets' },
  { path: '/employee/activities', icon: Activity, label: 'Activity' },
  { path: '/employee/productivity', icon: TrendingUp, label: 'Productivity' },
  { path: '/employee/profile', icon: User, label: 'Profile' },
  { path: '/employee/download', icon: Download, label: 'Download App' }
];

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && <Logo size="sm" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed((value) => !value)}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive ? "border-l-2 border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <button
            onClick={() => navigate('/employee/profile')}
            className="mb-3 w-full text-left transition-opacity hover:opacity-80"
            title="Go to Profile"
          >
            {!collapsed ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                  {user?.name?.charAt(0) || 'E'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.companyName || 'Employee'}</p>
                </div>
              </div>
            ) : (
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 font-semibold text-primary">
                <User size={18} />
              </div>
            )}
          </button>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      <main className={cn("flex-1 transition-all duration-300", collapsed ? "ml-16" : "ml-64")}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/50 px-6 backdrop-blur-sm">
          <div>
            <h1 className="text-lg font-semibold text-foreground">TaskHive Employee Portal</h1>
            <p className="text-xs text-muted-foreground">{user?.companyName || 'Company workspace'}</p>
          </div>
        </header>
        <div className="animate-fade-in p-6">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
