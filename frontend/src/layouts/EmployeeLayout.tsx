import { ReactNode, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { employeeRoutes } from '@/routes/routeMap';

interface EmployeeLayoutProps {
  children?: ReactNode;
}

export default function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const activeRoute = employeeRoutes.find((route) => location.pathname === route.fullPath || location.pathname.startsWith(`${route.fullPath}/`));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <SEO
        title={`TaskHive Employee ${activeRoute ? `| ${activeRoute.label}` : "| Dashboard"}`}
        description={`Employee workspace for ${activeRoute?.label?.toLowerCase() ?? "dashboard"} tracking, timesheets, and productivity visibility.`}
        path={location.pathname}
        robots="noindex, nofollow"
      />

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
          {employeeRoutes.map((route) => {
            const isActive = location.pathname === route.fullPath || location.pathname.startsWith(`${route.fullPath}/`);

            return (
              <NavLink
                key={route.fullPath}
                to={route.fullPath}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200",
                  isActive ? "border-l-2 border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <route.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{route.label}</span>}
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
    </>
  );
}
