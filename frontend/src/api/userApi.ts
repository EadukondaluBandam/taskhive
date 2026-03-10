import { ApiResponse, apiClient } from "./client";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "employee";
  companyId?: string | null;
  companyName?: string | null;
  createdAt: string;
}

export interface CompanyDto {
  id: string;
  name: string;
  createdAt: string;
  _count?: {
    users: number;
    projects: number;
  };
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  password: string;
}

export const userApi = {
  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<UserDto>>("/users/me");
    return data.data;
  },

  async listCompanies() {
    const { data } = await apiClient.get<ApiResponse<CompanyDto[]>>("/superadmin/companies");
    return data.data;
  },

  async listAdmins() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/superadmin/admins");
    return data.data;
  },

  async listEmployees() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/superadmin/employees");
    return data.data;
  },

  async deleteAdmin(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/superadmin/admin/${id}`);
  },

  async deleteEmployeeAsSuperadmin(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/superadmin/user/${id}`);
  },

  async listCompanyEmployees() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/admin/employees");
    return data.data;
  },

  async createEmployee(input: CreateEmployeeInput) {
    const { data } = await apiClient.post<ApiResponse<UserDto>>("/admin/employees", input);
    return data.data;
  },

  async updateEmployee(id: string, input: Partial<CreateEmployeeInput>) {
    const { data } = await apiClient.put<ApiResponse<UserDto>>(`/admin/employees/${id}`, input);
    return data.data;
  },

  async deleteEmployee(id: string) {
    await apiClient.delete<ApiResponse<Record<string, never>>>(`/admin/employees/${id}`);
  }
};
