import axios, { AxiosError } from "axios";

export const TOKEN_STORAGE_KEY = "taskhive_token";

const normalizeApiBaseUrl = (rawValue: string) => {
  const trimmed = rawValue.trim();
  if (!trimmed) return "/api";
  return trimmed.endsWith("/api") ? trimmed : `${trimmed.replace(/\/$/, "")}/api`;
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL || "");

let accessToken: string | null =
  typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_STORAGE_KEY) : null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;

  if (typeof window === "undefined") return;

  if (token) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
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
      return `Cannot reach API server at ${API_BASE_URL}.`;
    }

    return axiosError.response.data?.message || axiosError.message || fallback;
  }

  if (error instanceof Error) return error.message;
  return fallback;
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
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

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAccessToken(null);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
