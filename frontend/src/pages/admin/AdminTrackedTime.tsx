import { useQuery } from "@tanstack/react-query";
import { Clock, Coffee, AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { dashboardApi } from "@/api/dashboardApi";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const EMPTY_DATA = {
  totalTrackedMinutes: 0,
  avgPerEmployeeMinutes: 0,
  totalIdleMinutes: 0,
  excessiveIdleEmployees: 0,
  hourlyDistribution: [],
  employeeBreakdown: []
};

const formatMinutes = (minutes: number) => {
  const safe = minutes || 0;
  const h = Math.floor(safe / 60);
  const m = safe % 60;
  return `${h}h ${m}m`;
};

export default function AdminTrackedTime() {
  const { data } = useQuery({
    queryKey: ["dashboard", "tracked-time"],
    queryFn: dashboardApi.getTrackedTime
  });

  const tracked = data ?? EMPTY_DATA;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Total Tracked Time</h2>
        <p className="text-muted-foreground">Away and idle time overview across the organization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Tracked" value={formatMinutes(tracked.totalTrackedMinutes)} icon={Clock} variant="primary" />
        <StatCard title="Avg Per Employee" value={formatMinutes(tracked.avgPerEmployeeMinutes)} icon={TrendingUp} variant="success" />
        <StatCard title="Total Idle Time" value={formatMinutes(tracked.totalIdleMinutes)} icon={Coffee} variant="warning" />
        <StatCard title="Excessive Idle" value={tracked.excessiveIdleEmployees ?? 0} icon={AlertTriangle} variant="destructive" />
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Hourly Activity Distribution</h3>
        {tracked.hourlyDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={tracked.hourlyDistribution}>
              <defs>
                <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="idleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px"
                }}
              />
              <Area type="monotone" dataKey="active" stroke="hsl(199, 89%, 48%)" fill="url(#activeGradient)" strokeWidth={2} name="Active" />
              <Area type="monotone" dataKey="idle" stroke="hsl(38, 92%, 50%)" fill="url(#idleGradient)" strokeWidth={2} name="Idle" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground">No tracked time records yet.</p>
        )}
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">Employee Time Breakdown</h3>
        </div>
        {tracked.employeeBreakdown.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Employee</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Active Time</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Idle Time</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Away Time</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {tracked.employeeBreakdown.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 table-row-hover">
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4 text-success font-medium">{formatMinutes(user.activeMinutes)}</td>
                    <td className="p-4 text-warning font-medium">{formatMinutes(user.idleMinutes)}</td>
                    <td className="p-4 text-muted-foreground">{formatMinutes(user.awayMinutes)}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${user.efficiency > 80 ? "bg-success" : user.efficiency > 60 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${user.efficiency}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-foreground">{user.efficiency}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-sm text-muted-foreground">No tracked employee records yet.</div>
        )}
      </div>
    </div>
  );
}
