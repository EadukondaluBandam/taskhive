import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, Loader2, Users, Building2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type AuthView = "login" | "forgot" | "register";

const emptyRegisterData = {
  companyName: "",
  adminName: "",
  adminEmail: "",
  password: "",
  confirmPassword: ""
};

const emptyLoginData = {
  email: "",
  password: ""
};

export default function Login() {
  const [view, setView] = useState<AuthView>("login");
  const [loginData, setLoginData] = useState(emptyLoginData);
  const [registerData, setRegisterData] = useState(emptyRegisterData);
  const [forgotEmail, setForgotEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { login, forgotPassword, registerNewAdmin, getCurrentUser } = useAuth();
  const navigate = useNavigate();

  const resetRegisterForm = () => {
    setRegisterData(emptyRegisterData);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const resetLoginForm = () => {
    setLoginData(emptyLoginData);
    setShowPassword(false);
    setRememberMe(false);
  };

  const resetForgotForm = () => {
    setForgotEmail("");
  };

  const clearStatus = () => {
    setError("");
    setSuccess("");
  };

  const switchView = (nextView: AuthView) => {
    clearStatus();
    if (nextView === "login") resetLoginForm();
    if (nextView === "register") resetRegisterForm();
    if (nextView === "forgot") resetForgotForm();
    setView(nextView);
  };

  useEffect(() => {
    resetLoginForm();
    resetRegisterForm();
    resetForgotForm();
    clearStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();
    setIsLoading(true);

    const email = loginData.email.trim();
    const password = loginData.password.trim();
    const result = await login(email, password);

    if (result.success) {
      const user = await getCurrentUser();
      if (user?.role === "admin" || user?.role === "super_admin") {
        navigate("/admin");
      } else {
        navigate("/employee");
      }
    } else {
      setError(result.error || "Login failed");
    }

    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();
    setIsLoading(true);

    const result = await forgotPassword(forgotEmail.trim());

    if (result.success) {
      setSuccess("Password reset link sent to your email!");
      resetForgotForm();
    } else {
      setError(result.error || "Failed to send reset link");
    }

    setIsLoading(false);
  };

  const handleNewAdminRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearStatus();

    const trimmedEmail = registerData.adminEmail.trim();
    const trimmedCompanyName = registerData.companyName.trim();
    const trimmedAdminName = registerData.adminName.trim();
    const trimmedPassword = registerData.password.trim();
    const trimmedConfirmPassword = registerData.confirmPassword.trim();

    if (!trimmedEmail || !trimmedCompanyName || !trimmedAdminName || !trimmedPassword || !trimmedConfirmPassword) {
      setError("All fields are required");
      return;
    }

    if (trimmedPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    const result = await registerNewAdmin({
      email: trimmedEmail,
      password: trimmedPassword,
      companyName: trimmedCompanyName,
      adminName: trimmedAdminName,
      confirmPassword: trimmedConfirmPassword
    });

    if (result.success) {
      setSuccess("Company account created successfully.");
      resetRegisterForm();
      navigate("/admin");
    } else {
      setError(result.error || "Registration failed");
    }

    setIsLoading(false);
  };

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="space-y-6" key="login-form">
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-fade-in">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="username"
              value={loginData.email}
              onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
              className="pl-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={loginData.password}
              onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
              className="pl-10 pr-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remember"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked as boolean)}
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Remember me
          </label>
        </div>
        <div className="flex gap-4">
          <button type="button" onClick={() => switchView("forgot")} className="text-sm text-primary hover:underline">
            Forgot password?
          </button>
          <button type="button" onClick={() => switchView("register")} className="text-sm text-primary hover:underline">
            New registration?
          </button>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>
    </form>
  );

  const renderForgotPasswordForm = () => (
    <>
      <button onClick={() => switchView("login")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </button>

      <form onSubmit={handleForgotPassword} className="space-y-6" key="forgot-form">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm animate-fade-in">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Enter your email address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="forgot-email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="pl-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Sending reset link...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </form>
    </>
  );

  const renderRegisterForm = () => (
    <>
      <button onClick={() => switchView("login")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Login
      </button>

      <form onSubmit={handleNewAdminRegister} className="space-y-6" key="register-form">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm animate-fade-in">
            {success}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="company-name" className="text-sm font-medium text-foreground">
              Company Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="company-name"
                type="text"
                placeholder="Your company name"
                autoComplete="organization"
                value={registerData.companyName}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, companyName: e.target.value }))}
                className="pl-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-name" className="text-sm font-medium text-foreground">
              Admin Full Name *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="admin-name"
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                value={registerData.adminName}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, adminName: e.target.value }))}
                className="pl-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="register-email" className="text-sm font-medium text-foreground">
              Admin Email *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="register-email"
                type="email"
                placeholder="admin@yourcompany.com"
                autoComplete="username"
                value={registerData.adminEmail}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, adminEmail: e.target.value }))}
                className="pl-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="register-password" className="text-sm font-medium text-foreground">
              Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={registerData.password}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                className="pl-10 pr-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={registerData.confirmPassword}
                onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                className="pl-10 pr-10 h-12 bg-card border-border focus:border-primary focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Creating account...
            </>
          ) : (
            "Create New Company Admin"
          )}
        </Button>
      </form>
    </>
  );

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {view === "login" ? "Welcome to TaskHive" : view === "forgot" ? "Reset Password" : "Create New Company"}
            </h1>
            <p className="text-muted-foreground mt-2">
              {view === "login"
                ? "Sign in to access your dashboard"
                : view === "forgot"
                  ? "Enter your email to receive reset instructions"
                  : "Create a new admin account for your company"}
            </p>
          </div>

          <div className="space-y-6">
            {view === "login" && renderLoginForm()}
            {view === "forgot" && renderForgotPasswordForm()}
            {view === "register" && renderRegisterForm()}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-background to-cyan-500/10 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,hsl(199_89%_48%/0.1),transparent_50%)]" />

        <div className="relative z-10 text-center max-w-lg">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Enterprise Time Tracking
            </div>
          </div>

          <h2 className="text-4xl font-bold text-foreground mb-4">
            Track Time.
            <span className="text-gradient"> Boost Productivity.</span>
          </h2>

          <p className="text-lg text-muted-foreground">
            Comprehensive workforce analytics and time management for modern enterprises.
          </p>
        </div>
      </div>
    </div>
  );
}
