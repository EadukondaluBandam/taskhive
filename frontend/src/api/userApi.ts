import { ApiResponse, apiClient } from "./client";

export interface UserDto {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  organizationId?: string | null;
  createdAt: string;
}

export const userApi = {
  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<UserDto>>("/users/me");
    return data.data;
  },

  async listUsers() {
    const { data } = await apiClient.get<ApiResponse<UserDto[]>>("/users");
    return data.data;
  }
};
