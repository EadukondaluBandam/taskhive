import { ApiResponse, apiClient, setAccessToken } from "./client";

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  organizationId?: string | null;
}

export interface AuthPayload {
  user: AuthUserResponse;
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: "super_admin" | "admin" | "employee";
  organizationId?: string;
}

export interface RegisterCompanyInput {
  companyName: string;
  adminName: string;
  email: string;
  password: string;
}

const applyAuthPayload = (payload: AuthPayload) => {
  setAccessToken(payload.accessToken);
  return payload;
};

export const authApi = {
  async login(input: LoginInput) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/login", input);
    return applyAuthPayload(data.data);
  },

  async register(input: RegisterInput) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/register", input);
    return applyAuthPayload(data.data);
  },

  async registerCompany(input: RegisterCompanyInput) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/register-company", input);
    return applyAuthPayload(data.data);
  },

  async refresh() {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/refresh", {});
    return applyAuthPayload(data.data);
  },

  async logout() {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/logout", {});
    setAccessToken(null);
  },

  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<AuthUserResponse>>("/users/me");
    return data.data;
  }
};
