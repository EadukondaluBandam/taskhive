import { ApiResponse, apiClient, setAccessToken } from "./client";

export interface AuthUserResponse {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "employee";
  companyId?: string | null;
  companyName?: string | null;
}

export interface AuthPayload {
  token: string;
  user: AuthUserResponse;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterCompanyInput {
  companyName: string;
  name: string;
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface SetPasswordInput {
  token: string;
  password: string;
}

const applyAuthPayload = (payload: AuthPayload) => {
  setAccessToken(payload.token);
  return payload;
};

export const authApi = {
  async login(input: LoginInput) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/login", input);
    return applyAuthPayload(data.data);
  },

  async registerCompany(input: RegisterCompanyInput) {
    const { data } = await apiClient.post<ApiResponse<AuthPayload>>("/auth/register-company", input);
    return applyAuthPayload(data.data);
  },

  async logout() {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/logout", {});
    setAccessToken(null);
  },

  async forgotPassword(email: string) {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/forgot-password", { email });
  },

  async resetPassword(input: ResetPasswordInput) {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/reset-password", input);
  },

  async setPassword(input: SetPasswordInput) {
    await apiClient.post<ApiResponse<Record<string, never>>>("/auth/reset-password", {
      token: input.token,
      newPassword: input.password
    });
  },

  async getCurrentUser() {
    const { data } = await apiClient.get<ApiResponse<AuthUserResponse>>("/users/me");
    return data.data;
  }
};
