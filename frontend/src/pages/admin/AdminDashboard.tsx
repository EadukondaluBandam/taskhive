import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Clock,
  TrendingUp,
  FolderKanban,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { StatCard } from '@/components/StatCard';
import { ProgressRing } from '@/components/ProgressRing';
import { dashboardApi, type DashboardSummary } from '@/api/dashboardApi';
import { ProjectStorage, TimerStorage, UserStorage } from '@/lib/storage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard', 'summary'],
    queryFn: dashboardApi.getSummary
  });

  const users = useMemo(() => UserStorage.getAll(), []);
  const projects = useMemo(() => ProjectStorage.getAll(), []);
  const activeTimers = useMemo(() => TimerStorage.getAllActive(), []);

  const activeUsers = summary?.totalEmployees ?? users.filter((user) => user.status === 'active').length;
  const activeProjects = summary?.activeProjects ?? projects.filter((project) => project.status === 'active').length;
  const pendingTasks = 0;
  const avgProductivity = summary?.productivityScore ?? 0;
  const totalHours = summary?.totalHours ?? 0;

  const weeklyData = useMemo(
    () => [
      { day: 'Mon', productive: 0, idle: 0 },
      { day: 'Tue', productive: 0, idle: 0 },
      { day: 'Wed', productive: 0, idle: 0 },
      { day: 'Thu', productive: 0, idle: 0 },
      { day: 'Fri', productive: 0, idle: 0 },
      { day: 'Sat', productive: 0, idle: 0 },
      { day: 'Sun', productive: 0, idle: 0 }
    ],
    []
  );

  const productivityByTeam = useMemo(() => {
    const baseline = Math.max(0, Math.min(avgProductivity, 100));

    return [
      { team: 'Team A', productivity: baseline },
      { team: 'Team B', productivity: Math.max(0, baseline - 10) },
      { team: 'Team C', productivity: Math.min(100, baseline + 5) }
    ];
  }, [avgProductivity]);

  const rankedUsers = useMemo(
    () => [...users].sort((a, b) => b.productivity - a.productivity).slice(0, 5),
    [users]
  );

  const topProjects = useMemo(() => projects.slice(0, 4), [projects]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div onClick={() => navigate('/admin/users')} className="cursor-pointer">
          <StatCard
            title="Active Employees"
            value={activeUsers}
            subtitle={`of ${users.length} total`}
            icon={Users}
            variant="primary"
            trend={{ value: 12, isPositive: true }}
          />
        </div>
        <div onClick={() => navigate('/admin/projects')} className="cursor-pointer">
          <StatCard
            title="Active Projects"
            value={activeProjects}
            subtitle={`${Math.max(projects.length - activeProjects, 0)} completed/on-hold`}
            icon={FolderKanban}
            variant="success"
          />
        </div>
        <StatCard
          title="Total Hours Tracked"
          value={`${totalHours}h`}
          subtitle="This month"
          icon={Clock}
          variant="warning"
          trend={{ value: 8, isPositive: true }}
        />
        <div onClick={() => navigate('/admin/tasks')} className="cursor-pointer">
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            subtitle="Require attention"
            icon={AlertCircle}
            variant="destructive"
          />
        </div>
      </div>

      {activeTimers.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">Currently Working</h3>
          <div className="flex flex-wrap gap-2">
            {activeTimers.map((timer) => {
              const user = UserStorage.getById(timer.userId);
              const project = timer.projectId ? ProjectStorage.getById(timer.projectId) : undefined;

              return (
                <div
                  key={timer.userId}
                  className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/10 px-3 py-2"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  <span className="text-sm font-medium text-foreground">{user?.name || 'Unknown user'}</span>
                  <span className="text-xs text-muted-foreground">- {project?.name || 'Manual timer'}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Weekly Hours Overview</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Productive" />
              <Bar dataKey="idle" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Idle" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="mb-4 text-lg font-semibold text-foreground">Avg Productivity</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={avgProductivity} size={160} strokeWidth={12} label="Team Average" />
            <div className="mt-6 w-full space-y-3">
              {productivityByTeam.map((team) => (
                <div key={team.team} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{team.team}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${team.productivity}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-sm font-medium text-foreground">{team.productivity}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
            <Activity size={20} className="text-muted-foreground" />
          </div>
          <div className="space-y-3">
            {rankedUsers.length === 0 ? (
              <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">No employee data available yet.</div>
            ) : (
              rankedUsers.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                    {index + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">{user.productivity}%</p>
                    <p className="text-xs text-muted-foreground">{user.totalHours}h</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Project Status</h3>
            <FolderKanban size={20} className="text-muted-foreground" />
          </div>
          <div className="space-y-4">
            {topProjects.length === 0 ? (
              <div className="rounded-lg bg-muted/30 p-4 text-sm text-muted-foreground">No projects available yet.</div>
            ) : (
              topProjects.map((project) => (
                <div key={project.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground">{project.team.length} team members</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        project.status === 'active'
                          ? 'bg-success/10 text-success'
                          : project.status === 'completed'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-medium text-foreground">{project.progress}%</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
