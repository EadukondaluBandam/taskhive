import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi, type AuthUserResponse } from "@/api/authApi";
import { initializeStorage, NotificationStorage, ProjectStorage, SessionStorage, TaskStorage, TimeEntryStorage, TimerStorage, UserStorage } from "@/lib/storage";
import { type User } from "@/lib/types";
import { toApiErrorMessage } from "@/api/client";
import { toast } from "sonner";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  department: string;
  companyName?: string;
}

interface NewAdminData {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  adminName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: { name: string; email: string; password: string; role?: "admin" | "employee" }) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => Promise<void>;
  getCurrentUser: () => Promise<AuthUser | null>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  registerNewAdmin: (data: NewAdminData) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (companyName: string) => Promise<void>;
  isAuthenticated: boolean;
  sessionHours: number;
  checkSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTO_LOGOUT_HOURS = 10;
const WARNING_HOURS = 9.67;

const mapApiUser = (apiUser: AuthUserResponse): AuthUser => ({
  id: apiUser.id,
  name: apiUser.name,
  email: apiUser.email,
  role: apiUser.role === "employee" ? "employee" : "admin",
  department: "General",
  companyName: undefined
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionHours, setSessionHours] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const [sessionStartAt, setSessionStartAt] = useState<string | null>(null);

  useEffect(() => {
    initializeStorage({ users: [], projects: [], tasks: [], timeEntries: [], activities: [] });
  }, []);

  const bootstrapAuth = useQuery({
    queryKey: ["auth", "current-user"],
    queryFn: async () => {
      try {
        return await authApi.getCurrentUser();
      } catch (_firstError) {
        try {
          await authApi.refresh();
          return await authApi.getCurrentUser();
        } catch (_secondError) {
          return null;
        }
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000
  });

  useEffect(() => {
    if (!bootstrapAuth.data) {
      setUser(null);
      setSessionHours(0);
      setWarningShown(false);
      setSessionStartAt(null);
      SessionStorage.end();
      return;
    }

    const mapped = mapApiUser(bootstrapAuth.data);
    setUser(mapped);
    setWarningShown(false);
    setSessionStartAt((prev) => prev || new Date().toISOString());
    SessionStorage.create(mapped.id);
  }, [bootstrapAuth.data]);

  const loginMutation = useMutation({
    mutationFn: authApi.login
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout
  });

  const getCurrentUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const current = await authApi.getCurrentUser();
      const mapped = mapApiUser(current);
      setUser(mapped);
      return mapped;
    } catch (error) {
      const message = toApiErrorMessage(error, "Failed to fetch current user");
      toast.error("Session Error", { description: message });
      return null;
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const payload = await loginMutation.mutateAsync({ email, password });
        const mapped = mapApiUser(payload.user);

        setUser(mapped);
        setSessionStartAt(new Date().toISOString());
        setSessionHours(0);
        setWarningShown(false);
        SessionStorage.create(mapped.id);
        NotificationStorage.notifyLogin(mapped.id);
        await queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });

        toast.success("Welcome back!", {
          description: `Logged in as ${mapped.name}`
        });

        return { success: true };
      } catch (error) {
        return { success: false, error: toApiErrorMessage(error, "Login failed") };
      }
    },
    [loginMutation, queryClient]
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; role?: "admin" | "employee" }) => {
      try {
        await registerMutation.mutateAsync({
          ...payload,
          role: payload.role === "admin" ? "admin" : "employee"
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: toApiErrorMessage(error, "Registration failed") };
      }
    },
    [registerMutation]
  );

  const logout = useCallback(
    async (reason?: string) => {
      if (user) {
        const timerState = TimerStorage.get(user.id);
        if (timerState && timerState.isRunning) {
          const project = ProjectStorage.getById(timerState.projectId || "");
          const task = TaskStorage.getById(timerState.taskId || "");

          TimeEntryStorage.create({
            userId: user.id,
            userName: user.name,
            projectId: timerState.projectId,
            projectName: project?.name || "Unknown",
            taskId: timerState.taskId,
            taskName: task?.name || "Unknown",
            startTime: new Date(timerState.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            endTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
            duration: Math.floor(timerState.elapsedSeconds / 60),
            description: timerState.description,
            date: new Date().toISOString().split("T")[0]
          });
          TimerStorage.clear(user.id);
        }

        if (!reason) NotificationStorage.notifyLogout(user.id);
      }

      try {
        await logoutMutation.mutateAsync();
      } catch (_error) {
        // Keep client-side logout behavior even if backend logout fails.
      }

      setUser(null);
      setSessionHours(0);
      setWarningShown(false);
      setSessionStartAt(null);
      SessionStorage.end();
      await queryClient.invalidateQueries({ queryKey: ["auth", "current-user"] });
    },
    [logoutMutation, queryClient, user]
  );

  const checkSession = useCallback(() => {
    if (!user || !sessionStartAt) return;

    const elapsedHours = (Date.now() - new Date(sessionStartAt).getTime()) / (1000 * 60 * 60);
    setSessionHours(elapsedHours);

    if (elapsedHours >= WARNING_HOURS && elapsedHours < AUTO_LOGOUT_HOURS && !warningShown) {
      setWarningShown(true);
      NotificationStorage.notifyAutoLogoutWarning(user.id);
      toast.warning("Session Warning", {
        description: "Your session will auto-logout in 20 minutes. Please save your work.",
        duration: 10000
      });
    }

    if (elapsedHours >= AUTO_LOGOUT_HOURS) {
      toast.error("Session Ended", {
        description: "You have been auto-logged out after 10 hours."
      });
      void logout("Auto-logout after 10 hours");
    }
  }, [logout, sessionStartAt, user, warningShown]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSession, 60000);
    checkSession();
    return () => clearInterval(interval);
  }, [checkSession, user]);

  const forgotPassword = useCallback(async (_email: string): Promise<{ success: boolean; error?: string }> => {
    return {
      success: false,
      error: "Forgot password endpoint is not available yet."
    };
  }, []);

  const registerNewAdmin = useCallback(
    async (data: NewAdminData): Promise<{ success: boolean; error?: string }> => {
      const email = data.email.trim();
      const password = data.password.trim();
      const confirmPassword = data.confirmPassword.trim();
      const companyName = data.companyName.trim();
      const adminName = data.adminName.trim();

      if (!email || !password || !companyName || !adminName) {
        return { success: false, error: "All fields are required." };
      }
      if (password.length < 8) {
        return { success: false, error: "Password must be at least 8 characters." };
      }
      if (password !== confirmPassword) {
        return { success: false, error: "Passwords do not match." };
      }

      try {
        await authApi.registerCompany({
          companyName,
          adminName,
          email,
          password
        });
        return { success: true };
      } catch (error) {
        return { success: false, error: toApiErrorMessage(error, "Admin registration failed") };
      }
    },
    []
  );

  const updateProfile = useCallback(async (companyName: string) => {
    if (!user) return;
    const updated = { ...user, companyName };
    setUser(updated);
    UserStorage.update(user.id, { companyName } as Partial<User>);
    toast.success("Profile Updated", {
      description: "Company name has been updated successfully"
    });
  }, [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      login,
      register,
      logout,
      getCurrentUser,
      forgotPassword,
      registerNewAdmin,
      updateProfile,
      isAuthenticated: !!user,
      sessionHours,
      checkSession
    }),
    [checkSession, forgotPassword, getCurrentUser, login, logout, register, registerNewAdmin, sessionHours, updateProfile, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
