import { ApiResponse, apiClient } from "./client";

export interface DashboardSummary {
  totalEmployees: number;
  activeProjects: number;
  activeSessions: number;
  totalHours: number;
  productiveApps: number;
  idleAlerts: number;
  productivityScore: number;
}

export interface ActivityTimelinePoint {
  day: string;
  productive: number;
  idle: number;
}

export interface RecentActivity {
  id: string;
  userName: string;
  type: string;
  description: string;
  timestamp: string;
  category: "productive" | "idle";
}

export interface ActivityInsights {
  activeSessions: number;
  totalActiveHours: number;
  productiveApps: number;
  idleAlerts: number;
  activityTimeline: ActivityTimelinePoint[];
  recentActivities: RecentActivity[];
}

export interface UsageItem {
  name: string;
  category: string;
  usage: number;
}

export interface DepartmentSummary {
  name: string;
  members: number;
  productivity: number;
}

export interface OrganizationSummary {
  totalDepartments: number;
  activeEmployees: number;
  activeProjects: number;
  avgHoursPerDay: number;
  productivityScore: number;
  topSites: UsageItem[];
  topApps: UsageItem[];
  departments: DepartmentSummary[];
  organizations: Array<{ id: string; name: string }>;
}

export interface HourlyDistribution {
  hour: string;
  active: number;
  idle: number;
}

export interface EmployeeTimeBreakdown {
  id: string;
  name: string;
  email: string;
  activeMinutes: number;
  idleMinutes: number;
  awayMinutes: number;
  efficiency: number;
}

export interface TrackedTimeOverview {
  totalTrackedMinutes: number;
  avgPerEmployeeMinutes: number;
  totalIdleMinutes: number;
  excessiveIdleEmployees: number;
  hourlyDistribution: HourlyDistribution[];
  employeeBreakdown: EmployeeTimeBreakdown[];
}

export interface TeamComparison {
  team: string;
  productivity: number;
  members: number;
}

export interface RankedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  productivity: number;
  totalHours: number;
}

export interface ProductivityOverview {
  orgProductivity: number;
  activeEmployees: number;
  topPerformer: RankedUser | null;
  targetGoal: number;
  teamComparison: TeamComparison[];
  individualRankings: RankedUser[];
}

export interface MonitoringEmployee {
  id: string;
  userId: string;
  name: string;
  email: string;
  task: string | null;
  status: "active";
  startedAt: string;
  activity: number;
}

export interface MonitoringSnapshot {
  activeNow: number;
  idle: number;
  away: number;
  lastCapture: string | null;
  employees: MonitoringEmployee[];
  message: string | null;
}

export const dashboardApi = {
  async getSummary() {
    const { data } = await apiClient.get<ApiResponse<DashboardSummary>>("/dashboard/summary");
    return data.data;
  },

  async getActivityInsights() {
    const { data } = await apiClient.get<ApiResponse<ActivityInsights>>("/dashboard/activity-insights");
    return data.data;
  },

  async getOrganizationSummary() {
    const { data } = await apiClient.get<ApiResponse<OrganizationSummary>>("/dashboard/organization-summary");
    return data.data;
  },

  async getTrackedTime() {
    const { data } = await apiClient.get<ApiResponse<TrackedTimeOverview>>("/dashboard/tracked-time");
    return data.data;
  },

  async getProductivityOverview() {
    const { data } = await apiClient.get<ApiResponse<ProductivityOverview>>("/dashboard/productivity-overview");
    return data.data;
  },

  async getMonitoringSnapshot() {
    const { data } = await apiClient.get<ApiResponse<MonitoringSnapshot>>("/dashboard/monitoring-snapshot");
    return data.data;
  }
};
