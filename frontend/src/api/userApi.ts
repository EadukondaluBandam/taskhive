import { ApiResponse, apiClient } from "./client";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  status?: "pending" | "active" | "invited" | "suspended" | "archived";
  companyId?: string | null;
  companyName?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  totalHours?: number;
  productivity?: number;
  createdAt: string;
}

export interface CreateAdminInput {
  name: string;
  email: string;
  companyName: string;
  password?: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password?: string;
}

export interface CreateEmployeeAsSuperAdminInput extends CreateEmployeeInput {
  companyId: string;
  createdBy?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  status?: "active" | "suspended" | "archived";
}

export const userApi = {
  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<UserDto>>("/users/me");
    return data.data;
  },

  async listAdmins() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/superadmin/admins");
    return data.data;
  },

  async createAdmin(input: CreateAdminInput) {
    const { data } = await apiClient.post<ApiResponse<UserDto>>("/superadmin/admins", input);
    return data.data;
  },

  async deleteAdmin(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/superadmin/admins/${id}`);
  },

  async listEmployees() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/superadmin/employees");
    return data.data;
  },

  async createEmployeeAsSuperAdmin(input: CreateEmployeeAsSuperAdminInput) {
    const { data } = await apiClient.post<ApiResponse<UserDto>>("/superadmin/employees", input);
    return data.data;
  },

  async deleteEmployeeAsSuperAdmin(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/superadmin/employees/${id}`);
  },

  async listCompanyEmployees() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/admin/employees");
    return data.data;
  },

  async createEmployee(input: CreateEmployeeInput) {
    const { data } = await apiClient.post<ApiResponse<UserDto>>("/admin/employees", input);
    return data.data;
  },

  async updateEmployee(id: string, input: UpdateEmployeeInput) {
    const { data } = await apiClient.put<ApiResponse<UserDto>>(`/admin/employees/${id}`, input);
    return data.data;
  },

  async deleteEmployee(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/admin/employees/${id}`);
  }
};
