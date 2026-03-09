import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Zap, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/StatCard";
import { dashboardApi } from "@/api/dashboardApi";

const EMPTY_DATA = {
  activeSessions: 0,
  totalActiveHours: 0,
  productiveApps: 0,
  idleAlerts: 0,
  activityTimeline: [],
  recentActivities: []
};

export default function AdminActivity() {
  const { data } = useQuery({
    queryKey: ["dashboard", "activity-insights"],
    queryFn: dashboardApi.getActivityInsights
  });

  const insights = data ?? EMPTY_DATA;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activity Insights</h2>
        <p className="text-muted-foreground">Monitor employee activities across the organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Sessions" value={insights.activeSessions ?? 0} icon={Activity} variant="primary" />
        <StatCard
          title="Total Active Hours"
          value={`${insights.totalActiveHours ?? 0}h`}
          subtitle="From tracked entries"
          icon={Clock}
          variant="success"
        />
        <StatCard title="Productive Apps" value={insights.productiveApps ?? 0} icon={Zap} variant="warning" />
        <StatCard title="Idle Alerts" value={insights.idleAlerts ?? 0} icon={AlertTriangle} variant="destructive" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Activity Timeline</h3>
        {insights.activityTimeline.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insights.activityTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Bar dataKey="productive" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} name="Productive" stackId="a" />
              <Bar dataKey="idle" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Idle Alerts" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No activity data yet.</p>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Recent Activity Log</h3>
        </div>
        {insights.recentActivities.length > 0 ? (
          <div className="divide-y divide-border">
            {insights.recentActivities.slice(0, 8).map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      activity.category === "productive" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    }`}
                  >
                    {activity.category === "productive" ? <Zap size={18} /> : <Clock size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">{activity.userName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{new Date(activity.timestamp).toLocaleString("en-IN")}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No activity records found.</div>
        )}
      </div>
    </div>
  );
}
