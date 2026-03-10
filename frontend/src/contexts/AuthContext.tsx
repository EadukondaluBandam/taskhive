import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getAccessToken, toApiErrorMessage } from "@/api/client";
import { authApi, type AuthUserResponse } from "@/api/authApi";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "superadmin" | "admin" | "employee";
  companyId?: string | null;
  companyName?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerNewAdmin: (payload: { companyName: string; adminName: string; email: string; password: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  getCurrentUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mapUser = (user: AuthUserResponse): AuthUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  companyId: user.companyId ?? null,
  companyName: user.companyName ?? null
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const getCurrentUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return null;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      const mapped = mapUser(currentUser);
      setUser(mapped);
      return mapped;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await getCurrentUser();
      setIsBootstrapping(false);
    })();
  }, [getCurrentUser]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const payload = await authApi.login({ email, password });
      setUser(mapUser(payload.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: toApiErrorMessage(error, "Login failed") };
    }
  }, []);

  const registerNewAdmin = useCallback(async (payload: { companyName: string; adminName: string; email: string; password: string; confirmPassword: string }) => {
    if (payload.password !== payload.confirmPassword) {
      return { success: false, error: "Passwords do not match." };
    }

    try {
      const result = await authApi.registerCompany({
        companyName: payload.companyName.trim(),
        name: payload.adminName.trim(),
        email: payload.email.trim(),
        password: payload.password
      });
      setUser(mapUser(result.user));
      return { success: true };
    } catch (error) {
      return { success: false, error: toApiErrorMessage(error, "Registration failed") };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    try {
      await authApi.forgotPassword(email.trim());
      return { success: true };
    } catch (error) {
      return { success: false, error: toApiErrorMessage(error, "Failed to send reset link") };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      registerNewAdmin,
      logout,
      forgotPassword,
      getCurrentUser
    }),
    [forgotPassword, getCurrentUser, isBootstrapping, login, logout, registerNewAdmin, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
