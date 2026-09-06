import React, { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Mail, Eye, EyeOff, ShieldCheck, HardHat, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../../services/auth.service";

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState("admin@construction.local");
  const [password, setPassword] = useState("Admin@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login(email.trim(), password);
      toast.success(`Welcome back, ${result.user.fullName || "User"}!`);
      if (onSuccess) {
        onSuccess();
      } else {
        window.dispatchEvent(new CustomEvent("cmms:auth_changed"));
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const msg = err.message || "Invalid email or password. Please try again.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail("admin@construction.local");
    setPassword("Admin@123");
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-xl"
      >
        {/* Card Header with Construction Theme */}
        <div className="relative border-b border-border bg-gradient-to-br from-amber-500/10 via-background to-slate-900/5 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 ring-8 ring-amber-500/10 dark:bg-amber-500/30">
            <HardHat size={28} />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            CMMS Portal
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Construction Project Material Management System
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <ShieldCheck size={12} />
            <span>Secure Backend API Authentication</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              {errorMessage}
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@construction.local"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Password
              </label>
            </div>
            <div className="relative">
              <Lock
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pl-9 pr-9 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:opacity-50 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating with Backend...</span>
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Quick Demo Credentials helper */}
          <div className="mt-4 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-xs">
            <div className="flex items-center justify-between font-medium text-foreground">
              <span>Seeded Database Credentials</span>
              <button
                type="button"
                onClick={handleQuickDemo}
                className="text-[11px] font-semibold text-amber-600 hover:underline dark:text-amber-400"
              >
                Load Credentials
              </button>
            </div>
            <div className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
              <div>
                Email: <span className="font-mono text-foreground">admin@construction.local</span>
              </div>
              <div>
                Password: <span className="font-mono text-foreground">Admin@123</span>
              </div>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
