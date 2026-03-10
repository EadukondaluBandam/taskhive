import { useQuery } from '@tanstack/react-query';
import { Building2, FolderKanban, ListTodo, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardApi } from '@/api/dashboardApi';
import { StatCard } from '@/components/StatCard';

export default function AdminDashboard() {
  const { user } = useAuth();
  const isSuperadmin = user?.role === 'superadmin';

  const { data } = useQuery({
    queryKey: ['dashboard', user?.role],
    queryFn: () => (isSuperadmin ? dashboardApi.getSuperadminDashboard() : dashboardApi.getAdminDashboard()),
    enabled: !!user
  });

  if (isSuperadmin) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Platform Dashboard</h2>
          <p className="text-muted-foreground">High-level visibility across every company in the SaaS platform.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard title="Total Companies" value={data?.totalCompanies ?? 0} icon={Building2} variant="primary" />
          <StatCard title="Total Admins" value={data?.totalAdmins ?? 0} icon={ShieldCheck} variant="success" />
          <StatCard title="Total Employees" value={data?.totalEmployees ?? 0} icon={Users} variant="warning" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Company Dashboard</h2>
        <p className="text-muted-foreground">Operational view for your company workspace.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Employees" value={data?.employeeCount ?? 0} icon={Users} variant="primary" />
        <StatCard title="Projects" value={data?.projectCount ?? 0} icon={FolderKanban} variant="success" />
        <StatCard title="Tasks" value={data?.taskCount ?? 0} icon={ListTodo} variant="warning" />
      </div>
    </div>
  );
}
