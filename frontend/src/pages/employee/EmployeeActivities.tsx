import { Activity, Globe, Monitor, Clock, Coffee } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';

const COLORS = ['hsl(199, 89%, 48%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(280, 65%, 60%)'];

const appUsage = [
  { name: 'VS Code', duration: 180, category: 'productive' },
  { name: 'Chrome', duration: 120, category: 'neutral' },
  { name: 'Terminal', duration: 60, category: 'productive' },
  { name: 'Slack', duration: 45, category: 'productive' },
  { name: 'Figma', duration: 30, category: 'productive' },
];

const siteUsage = [
  { name: 'GitHub', duration: 90, category: 'productive' },
  { name: 'Stack Overflow', duration: 45, category: 'productive' },
  { name: 'Jira', duration: 30, category: 'productive' },
  { name: 'YouTube', duration: 15, category: 'unproductive' },
  { name: 'LinkedIn', duration: 10, category: 'neutral' },
];

const activityBreakdown = [
  { name: 'Active', value: 372, color: 'hsl(142, 71%, 45%)' },
  { name: 'Idle', value: 48, color: 'hsl(38, 92%, 50%)' },
  { name: 'Away', value: 30, color: 'hsl(var(--muted-foreground))' },
];

const timeline = [
  { time: '09:00', type: 'active', description: 'Started working on UPI Integration', duration: '2h 30m' },
  { time: '11:30', type: 'idle', description: 'Short break', duration: '15m' },
  { time: '11:45', type: 'active', description: 'Code review session', duration: '45m' },
  { time: '12:30', type: 'away', description: 'Lunch break', duration: '30m' },
  { time: '13:00', type: 'active', description: 'Weather Integration API', duration: '3h 30m' },
  { time: '16:30', type: 'idle', description: 'Reading documentation', duration: '30m' },
];

export default function EmployeeActivities() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Activities</h2>
        <p className="text-muted-foreground">Your activity timeline and usage breakdown</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Time"
          value="6h 12m"
          icon={Activity}
          variant="success"
        />
        <StatCard
          title="Idle Time"
          value="48m"
          icon={Clock}
          variant="warning"
        />
        <StatCard
          title="Away Time"
          value="30m"
          icon={Coffee}
          variant="default"
        />
        <StatCard
          title="Top App"
          value="VS Code"
          subtitle="3h usage"
          icon={Monitor}
          variant="primary"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Pie Chart */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Time Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={activityBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {activityBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10}h`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Apps Usage */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Apps</h3>
          </div>
          <div className="space-y-3">
            {appUsage.map((app) => (
              <div key={app.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    app.category === 'productive' ? 'bg-success' : 
                    app.category === 'neutral' ? 'bg-warning' : 'bg-destructive'
                  }`} />
                  <span className="text-sm text-foreground">{app.name}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {Math.floor(app.duration / 60)}h {app.duration % 60}m
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Sites Usage */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe size={18} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Top Sites</h3>
          </div>
          <div className="space-y-3">
            {siteUsage.map((site) => (
              <div key={site.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    site.category === 'productive' ? 'bg-success' : 
                    site.category === 'neutral' ? 'bg-warning' : 'bg-destructive'
                  }`} />
                  <span className="text-sm text-foreground">{site.name}</span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {site.duration}m
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-card rounded-xl border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-6">Activity Timeline</h3>
        <div className="space-y-4">
          {timeline.map((item, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${
                  item.type === 'active' ? 'bg-success' :
                  item.type === 'idle' ? 'bg-warning' : 'bg-muted-foreground'
                }`} />
                {index < timeline.length - 1 && (
                  <div className="w-px h-full bg-border flex-1 mt-1" />
                )}
              </div>
              <div className="flex-1 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{item.description}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    item.type === 'active' ? 'bg-success/10 text-success' :
                    item.type === 'idle' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {item.duration}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
