import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, Award, Target } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { ProgressRing } from "@/components/ProgressRing";
import { dashboardApi } from "@/api/dashboardApi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

const EMPTY_DATA = {
  orgProductivity: 0,
  activeEmployees: 0,
  topPerformer: null,
  targetGoal: 90,
  teamComparison: [],
  individualRankings: []
};

export default function AdminProductivity() {
  const { data } = useQuery({
    queryKey: ["dashboard", "productivity-overview"],
    queryFn: dashboardApi.getProductivityOverview
  });

  const overview = data ?? EMPTY_DATA;
  const radarData = overview.teamComparison.map((t) => ({
    team: t.team,
    productivity: t.productivity,
    fullMark: 100
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Productivity Overview</h2>
        <p className="text-muted-foreground">Efficiency comparison across teams and individuals</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Org Productivity" value={`${overview.orgProductivity ?? 0}%`} icon={TrendingUp} variant="primary" />
        <StatCard title="Active Employees" value={overview.activeEmployees ?? 0} icon={Users} variant="success" />
        <StatCard
          title="Top Performer"
          value={overview.topPerformer?.name || "N/A"}
          subtitle={overview.topPerformer ? `${overview.topPerformer.productivity}% efficiency` : "No data"}
          icon={Award}
          variant="warning"
        />
        <StatCard title="Target Goal" value={`${overview.targetGoal ?? 90}%`} subtitle="Organization target" icon={Target} variant="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Team Productivity Comparison</h3>
          {overview.teamComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={overview.teamComparison} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis dataKey="team" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="productivity" fill="hsl(199, 89%, 48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No team productivity data yet.</p>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Team Performance Radar</h3>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="team" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <Radar name="Productivity" dataKey="productivity" stroke="hsl(199, 89%, 48%)" fill="hsl(199, 89%, 48%)" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">No radar data available.</p>
          )}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Individual Performance Rankings</h3>
        {overview.individualRankings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {overview.individualRankings.slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex flex-col items-center p-4 bg-muted/30 rounded-lg">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg mb-3 ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-500"
                      : index === 1
                        ? "bg-gray-400/20 text-gray-400"
                        : index === 2
                          ? "bg-orange-600/20 text-orange-600"
                          : "bg-primary/20 text-primary"
                  }`}
                >
                  #{index + 1}
                </div>
                <ProgressRing value={user.productivity ?? 0} size={80} strokeWidth={6} />
                <p className="text-sm font-medium text-foreground mt-3">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.totalHours}h tracked</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No ranked users yet.</p>
        )}
      </div>
    </div>
  );
}
