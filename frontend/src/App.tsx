import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import AdminLayout from "./layouts/AdminLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import { adminRoutes, employeeRoutes, publicPages } from "./routes/routeMap";

const queryClient = new QueryClient();

function ProtectedRoute({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: Array<"superadmin" | "admin" | "employee">;
}) {
  const { isAuthenticated, isBootstrapping, user } = useAuth();

  if (isBootstrapping) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "employee" ? "/employee/dashboard" : "/admin/dashboard"} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated, isBootstrapping, user } = useAuth();
  const HomePage = publicPages.home;
  const LoginPage = publicPages.login;
  const SetPasswordPage = publicPages.setPassword;
  const NotFoundPage = publicPages.notFound;

  if (isBootstrapping) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={<HomePage />}
      />
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={user?.role === "employee" ? "/employee/dashboard" : "/admin/dashboard"} replace />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route path="/home" element={<HomePage />} />
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="/reset-password" element={<SetPasswordPage />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin", "superadmin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        {adminRoutes.map((route) => {
          const Component = route.component;

          return <Route key={route.fullPath} path={route.path} element={<Component />} />;
        })}
      </Route>

      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee"]}>
            <EmployeeLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/employee/dashboard" replace />} />
        {employeeRoutes.map((route) => {
          const Component = route.component;

          return <Route key={route.fullPath} path={route.path} element={<Component />} />;
        })}
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HelmetProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </HelmetProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
