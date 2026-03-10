import { ApiResponse, apiClient } from "./client";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  status?: "pending" | "active" | "invited" | "suspended" | "archived";
  organizationId?: string | null;
  adminId?: string | null;
  adminName?: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  role: "admin" | "employee";
  organizationId?: string;
}

export const userApi = {
  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<UserDto>>("/users/me");
    return data.data;
  },

  async listUsers() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/users");
    return data.data;
  },

  async createUser(input: CreateUserInput) {
    const { data } = await apiClient.post<ApiResponse<UserDto>>("/users", input);
    return data.data;
  },

  async deleteUser(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/users/${id}`);
  },

  async listAdmins() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/superadmin/admins");
    return data.data;
  },

  async listEmployees() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/superadmin/employees");
    return data.data;
  },

  async listMyEmployees() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/admin/employees");
    return data.data;
  },

  async createEmployee(input: { name: string; email: string }) {
    const { data } = await apiClient.post<ApiResponse<UserDto>>("/admin/employee", input);
    return data.data;
  },

  async deleteEmployee(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/admin/employee/${id}`);
  },

  async deleteAdmin(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/superadmin/admin/${id}`);
  },

  async deleteEmployeeAsSuperAdmin(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/superadmin/employee/${id}`);
  }
};
