import axios, { AxiosError } from "axios";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").trim();

if (!API_BASE_URL) {
  throw new Error("VITE_API_URL is required");
}

let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ApiErrorPayload {
  success?: boolean;
  message?: string;
  data?: unknown;
  error?: {
    details?: Array<{ path?: string; message?: string }>;
  };
}

export const toApiErrorMessage = (error: unknown, fallback = "Request failed"): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiErrorPayload>;
    if (!axiosError.response) {
      return `Cannot reach API server at ${API_BASE_URL || "configured VITE_API_URL"}.`;
    }
    return axiosError.response?.data?.message || axiosError.message || fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});
