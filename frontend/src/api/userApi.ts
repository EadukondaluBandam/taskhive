import { ApiResponse, apiClient } from "./client";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  status?: "pending" | "active" | "invited" | "suspended" | "archived";
  organizationId?: string | null;
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
  }
};
