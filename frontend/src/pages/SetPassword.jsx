import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/api/authApi";
import { toApiErrorMessage } from "@/api/client";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);
  const isResetMode = location.pathname === "/reset-password";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid invite link. Token is missing.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (isResetMode) {
        await authApi.resetPassword({ token, newPassword: password });
      } else {
        await authApi.setPassword({ token, password });
      }
      navigate("/login", { replace: true });
    } catch (err) {
      setError(toApiErrorMessage(err, isResetMode ? "Failed to reset password" : "Failed to set password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{isResetMode ? "Reset Password" : "Set Password"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isResetMode
              ? "Choose a new password for your TaskHive account."
              : "Create your TaskHive password to activate your account."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="Minimum 8 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pl-9 pr-10"
                placeholder="Re-enter password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="mr-2 animate-spin" />
                Saving password...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
