import { ReactNode, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/Logo';
import SEO from '@/components/SEO';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { adminRoutes } from '@/routes/routeMap';

interface AdminLayoutProps {
  children?: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const activeRoute = adminRoutes.find((route) => location.pathname === route.fullPath || location.pathname.startsWith(`${route.fullPath}/`));

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      <SEO
        title={`TaskHive Admin ${activeRoute ? `| ${activeRoute.label}` : "| Dashboard"}`}
        description={`Admin workspace for ${activeRoute?.label?.toLowerCase() ?? "dashboard"} management, employee monitoring, and productivity reporting.`}
        path={location.pathname}
        robots="noindex, nofollow"
      />

      <div className="flex min-h-screen bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 h-full bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50",
            collapsed ? "w-16" : "w-64"
          )}
        >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && <Logo size="sm" />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto scrollbar-thin">
          {adminRoutes.map((route) => {
            const isActive = location.pathname === route.fullPath || location.pathname.startsWith(`${route.fullPath}/`);
            
            return (
              <NavLink
                key={route.fullPath}
                to={route.fullPath}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
                title={collapsed ? route.label : undefined}
              >
                <route.icon size={20} />
                {!collapsed && <span className="text-sm font-medium">{route.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={() => navigate('/admin/profile')}
            className="w-full text-left mb-3 hover:opacity-80 transition-opacity"
            title="Go to Profile"
          >
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                  {user?.name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold mx-auto">
                {user?.name?.charAt(0) || 'A'}
              </div>
            )}
          </button>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut size={18} />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
        </aside>

        {/* Main content */}
        <main className={cn(
          "flex-1 transition-all duration-300",
          collapsed ? "ml-16" : "ml-64"
        )}>
          {/* Top header */}
          <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div>
              <h1 className="text-lg font-semibold text-foreground">TaskHive Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.companyName || 'Company'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className="p-6 animate-fade-in">
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </>
  );
}


