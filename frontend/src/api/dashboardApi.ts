import { ApiResponse, apiClient } from "./client";

export interface AdminDashboardSummary {
  employeeCount: number;
  projectCount: number;
  taskCount: number;
}

export interface SuperadminDashboardSummary {
  totalCompanies: number;
  totalAdmins: number;
  totalEmployees: number;
}

export const dashboardApi = {
  async getAdminDashboard() {
    const { data } = await apiClient.get<ApiResponse<AdminDashboardSummary>>("/dashboard/admin");
    return data.data;
  },

  async getSuperadminDashboard() {
    const { data } = await apiClient.get<ApiResponse<SuperadminDashboardSummary>>("/dashboard/superadmin");
    return data.data;
  }
};
