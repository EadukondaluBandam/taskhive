import { FormEvent, useEffect, useMemo, useState } from "react";
import "./App.css";

type UserRole = "admin" | "employee";
type AppRoute = "/login" | "/admin" | "/employee";

type LoginUser = {
  id: string;
  email: string;
  role: UserRole;
};

type LoginState = {
  token: string;
  user: LoginUser;
};

type DesktopBridge = {
  getDesktopRole?: () => Promise<string | null>;
};

declare global {
  interface Window {
    TaskHiveDesktop?: DesktopBridge;
  }
}

const TOKEN_KEY = "taskhive.desktop.token";
const USER_KEY = "taskhive.desktop.user";
const DEFAULT_API_BASE_URL = "http://localhost:5000/api";

const normalizeRole = (value: unknown): UserRole | null => {
  if (value === "admin" || value === "employee") return value;
  return null;
};

const parseHashRoute = (): AppRoute => {
  const hash = window.location.hash.replace(/^#/, "") || "/login";
  if (hash === "/admin") return "/admin";
  if (hash === "/employee") return "/employee";
  return "/login";
};

const setHashRoute = (route: AppRoute) => {
  const nextHash = `#${route}`;
  if (window.location.hash !== nextHash) {
    window.location.hash = nextHash;
  }
};

const routeForRole = (role: UserRole): AppRoute => (role === "admin" ? "/admin" : "/employee");

const getStoredAuth = (): LoginState | null => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (!token || !rawUser) return null;
    const parsedUser = JSON.parse(rawUser) as LoginUser;
    const role = normalizeRole(parsedUser?.role);
    if (!role || !parsedUser?.id || !parsedUser?.email) return null;
    return {
      token,
      user: { ...parsedUser, role }
    };
  } catch (_err) {
    return null;
  }
};

const persistAuth = (auth: LoginState | null) => {
  if (!auth) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return;
  }
  localStorage.setItem(TOKEN_KEY, auth.token);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
};

const resolveLoginPayload = (payload: unknown): LoginState => {
  const data = payload as {
    token?: string;
    user?: LoginUser;
    success?: boolean;
    data?: { accessToken?: string; user?: LoginUser };
  };

  const token = data.token || data.data?.accessToken;
  const user = data.user || data.data?.user;
  const role = normalizeRole(user?.role);

  if (!token || !user?.id || !user?.email || !role) {
    throw new Error("Invalid login response from server");
  }

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role
    }
  };
};

const LoginScreen = ({
  onLogin,
  loading,
  error
}: {
  onLogin: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string;
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onLogin(email.trim(), password);
  };

  return (
    <div className="auth-shell">
      <form className="auth-card" onSubmit={submit}>
        <h1>TaskHive Desktop Login</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="error-text">{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? "Signing In..." : "Login"}
        </button>
      </form>
    </div>
  );
};

const Dashboard = ({
  role,
  user,
  buildRole,
  onLogout
}: {
  role: UserRole;
  user: LoginUser;
  buildRole: UserRole | null;
  onLogout: () => void;
}) => (
  <div className="dashboard-shell">
    <div className="dashboard-card">
      <h1>{role === "admin" ? "Admin Dashboard" : "Employee Dashboard"}</h1>
      <p>Signed in as {user.email}</p>
      <p>Role: {user.role}</p>
      {buildRole && buildRole !== role ? (
        <p className="warn-text">Role mismatch detected. Redirected to the allowed dashboard.</p>
      ) : null}
      <button onClick={onLogout}>Logout</button>
    </div>
  </div>
);

function App() {
  const [route, setRoute] = useState<AppRoute>(parseHashRoute());
  const [auth, setAuth] = useState<LoginState | null>(() => getStoredAuth());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [buildRole, setBuildRole] = useState<UserRole | null>(null);
  const apiBaseUrl = useMemo(
    () => (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, ""),
    []
  );

  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const readBuildRole = async () => {
      if (!window.TaskHiveDesktop?.getDesktopRole) return;
      try {
        const role = await window.TaskHiveDesktop.getDesktopRole();
        if (role === "admin" || role === "employee") {
          setBuildRole(role);
        }
      } catch (_err) {
        setBuildRole(null);
      }
    };
    void readBuildRole();
  }, []);

  useEffect(() => {
    if (!auth) {
      persistAuth(null);
      if (route !== "/login") setHashRoute("/login");
      return;
    }

    persistAuth(auth);
    const target = routeForRole(auth.user.role);
    if (route !== target) {
      setHashRoute(target);
    }
  }, [auth, route]);

  useEffect(() => {
    if (!auth) return;
    if (route === "/admin" && auth.user.role !== "admin") {
      setHashRoute(routeForRole(auth.user.role));
    }
    if (route === "/employee" && auth.user.role !== "employee") {
      setHashRoute(routeForRole(auth.user.role));
    }
  }, [auth, route]);

  const login = async (email: string, password: string) => {
    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${apiBaseUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Login failed");
      }

      const parsed = resolveLoginPayload(payload);
      setAuth(parsed);
      setHashRoute(routeForRole(parsed.user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setAuth(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setAuth(null);
    setError("");
    setHashRoute("/login");
  };

  if (!auth) {
    return <LoginScreen onLogin={login} loading={loading} error={error} />;
  }

  return (
    <Dashboard role={auth.user.role} user={auth.user} buildRole={buildRole} onLogout={logout} />
  );
}

export default App;
