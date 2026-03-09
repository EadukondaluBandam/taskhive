import { useQuery } from "@tanstack/react-query";
import { Building2, Users, FolderKanban, Clock, Globe, Monitor } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ProgressRing } from "@/components/ProgressRing";
import { dashboardApi } from "@/api/dashboardApi";

const EMPTY_DATA = {
  totalDepartments: 0,
  activeEmployees: 0,
  activeProjects: 0,
  avgHoursPerDay: 0,
  productivityScore: 0,
  topSites: [],
  topApps: [],
  departments: []
};

export default function AdminOrganization() {
  const { data } = useQuery({
    queryKey: ["dashboard", "organization-summary"],
    queryFn: dashboardApi.getOrganizationSummary
  });

  const summary = data ?? EMPTY_DATA;
  const totalProductiveUsage = [...summary.topSites, ...summary.topApps].reduce((acc, item) => acc + (item.usage ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Organization Summary</h2>
        <p className="text-muted-foreground">Sites and apps usage across the organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Departments" value={summary.totalDepartments ?? 0} icon={Building2} variant="primary" />
        <StatCard title="Active Employees" value={summary.activeEmployees ?? 0} icon={Users} variant="success" />
        <StatCard title="Active Projects" value={summary.activeProjects ?? 0} icon={FolderKanban} variant="warning" />
        <StatCard title="Avg Hours/Day" value={`${summary.avgHoursPerDay ?? 0}h`} icon={Clock} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Productivity Score</h3>
          <div className="flex flex-col items-center">
            <ProgressRing value={summary.productivityScore ?? 0} size={180} strokeWidth={14} label="Organization" />
            <div className="mt-6 w-full">
              <div className="text-center p-3 bg-success/10 rounded-lg">
                <p className="text-lg font-bold text-success">{totalProductiveUsage}</p>
                <p className="text-xs text-muted-foreground">Tracked Usage Signals</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Sites</h3>
          </div>
          {summary.topSites.length > 0 ? (
            <div className="space-y-3">
              {summary.topSites.map((site) => (
                <div key={site.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{site.name}</p>
                    <p className="text-xs text-muted-foreground">{site.category}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{site.usage}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No site usage data yet.</p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Apps</h3>
          </div>
          {summary.topApps.length > 0 ? (
            <div className="space-y-3">
              {summary.topApps.map((app) => (
                <div key={app.name} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.category}</p>
                  </div>
                  <span className="text-sm font-medium text-foreground">{app.usage}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No app usage data yet.</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Department Overview</h3>
        {summary.departments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {summary.departments.map((dept) => (
              <div key={dept.name} className="p-4 bg-muted/30 rounded-lg text-center">
                <p className="text-sm font-medium text-foreground mb-2">{dept.name}</p>
                <p className="text-3xl font-bold text-primary">{dept.productivity}%</p>
                <p className="text-xs text-muted-foreground mt-1">{dept.members} members</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No department data yet.</p>
        )}
      </div>
    </div>
  );
}
