import { useQuery } from "@tanstack/react-query";
import { Camera, Monitor, Clock, Activity } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { dashboardApi } from "@/api/dashboardApi";

const EMPTY_DATA = {
  activeNow: 0,
  idle: 0,
  away: 0,
  lastCapture: null,
  employees: [],
  message: "No active employees yet."
};

export default function AdminScreenshots() {
  const { data } = useQuery({
    queryKey: ["dashboard", "monitoring-snapshot"],
    queryFn: dashboardApi.getMonitoringSnapshot
  });

  const snapshot = data ?? EMPTY_DATA;
  const lastCaptureLabel = snapshot.lastCapture ? new Date(snapshot.lastCapture).toLocaleTimeString("en-IN") : "N/A";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Monitoring Snapshot</h2>
        <p className="text-muted-foreground">Active vs idle monitoring view</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Active Now" value={snapshot.activeNow ?? 0} icon={Activity} variant="success" />
        <StatCard title="Idle" value={snapshot.idle ?? 0} icon={Clock} variant="warning" />
        <StatCard title="Away" value={snapshot.away ?? 0} icon={Monitor} variant="destructive" />
        <StatCard title="Last Capture" value={lastCaptureLabel} subtitle="Latest real event" icon={Camera} variant="primary" />
      </div>

      {snapshot.employees.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-6 text-sm text-muted-foreground">
          {snapshot.message || "No active employees yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {snapshot.employees.map((employee) => (
            <div key={employee.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="aspect-video bg-muted/50 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Monitor size={40} className="mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{employee.task || "No task linked"}</p>
                  </div>
                </div>
                <div className="absolute top-3 right-3 px-2 py-1 text-xs font-medium rounded-full bg-success/90 text-success-foreground">
                  {employee.status}
                </div>
              </div>

              <div className="p-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-semibold">
                    {employee.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{employee.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(employee.startedAt).toLocaleTimeString("en-IN")}</p>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Activity Level</span>
                    <span className="font-medium text-success">{employee.activity}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-success" style={{ width: `${employee.activity}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-6 p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success" />
          <span className="text-sm text-muted-foreground">Active - Working</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning" />
          <span className="text-sm text-muted-foreground">Idle - Low Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive" />
          <span className="text-sm text-muted-foreground">Away - No Activity</span>
        </div>
      </div>
    </div>
  );
}
