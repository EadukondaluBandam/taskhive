import { ApiResponse, apiClient, setAccessToken } from "./client";

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: "super_admin" | "admin" | "employee";
  companyId?: string | null;
  companyName?: string | null;
  createdBy?: string | null;
  status?: string;
  createdAt?: string;
}

export interface AuthPayload {
  user: AuthUserResponse;
  accessToken: string;
  refreshToken?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
}

export interface SetPasswordInput {
  token: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
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

  async registerCompany(input: RegisterInput) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/register-company", input);
    return applyAuthPayload(data.data);
  },

  async forgotPassword(email: string) {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/forgot-password", { email });
  },

  async resetPassword(input: ResetPasswordInput) {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/reset-password", input);
  },

  async refresh(refreshToken: string) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/refresh", { refreshToken });
    return applyAuthPayload(data.data);
  },

  async logout() {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/logout", {});
    setAccessToken(null);
  },

  async setPassword(input: SetPasswordInput) {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/set-password", input);
  },

  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<AuthUserResponse>>("/users/me");
    return data.data;
  }
};
