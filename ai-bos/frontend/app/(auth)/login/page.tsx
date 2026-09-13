/**
 * app/(auth)/login/page.tsx
 *
 * Login + Sign-up page with tab toggle.
 * Calls POST /api/v1/auth/signup and POST /api/v1/auth/login,
 * stores the JWT, and redirects to /dashboard on success.
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { login, signup, ApiError } from "@/lib/api";

type Tab = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    try {
      if (tab === "signup") {
        const fullName = form.get("fullname") as string;
        await signup(email, password, fullName);
      } else {
        await login(email, password);
      }
      // JWT is stored — redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else {
        setError("Something went wrong. Is the backend running?");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Brand ─────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4 shadow-lg shadow-primary/30">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AI BOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          AI-powered Business Operating System
        </p>
      </div>

      {/* ── Card ──────────────────────────────────── */}
      <div className="rounded-2xl border bg-card shadow-xl shadow-black/5 p-8">
        {/* Tab switcher */}
        <div className="flex rounded-lg bg-muted p-1 mb-7">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setError(null);
              }}
              className={cn(
                "flex-1 rounded-md py-1.5 text-sm font-medium transition-all duration-200",
                tab === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name — signup only */}
          {tab === "signup" && (
            <div className="space-y-1.5">
              <label htmlFor="fullname" className="text-sm font-medium">
                Full name
              </label>
              <input
                id="fullname"
                name="fullname"
                type="text"
                autoComplete="name"
                required
                placeholder="Jayesh Magdum"
                className={inputCls}
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@company.com"
              className={inputCls}
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                required
                minLength={8}
                placeholder="••••••••"
                className={cn(inputCls, "pr-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot password link — login only */}
          {tab === "login" && (
            <div className="text-right">
              <button
                type="button"
                className="text-xs text-primary hover:underline underline-offset-4"
              >
                Forgot password?
              </button>
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={loading}
            id={tab === "login" ? "btn-signin" : "btn-signup"}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {tab === "login" ? "Signing in…" : "Creating account…"}
              </>
            ) : tab === "login" ? (
              "Sign in"
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        {/* ── Divider + OAuth placeholder ─────────── */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-card px-3 text-xs text-muted-foreground">
              or continue with
            </span>
          </div>
        </div>

        <Button variant="outline" className="w-full gap-2" type="button" id="btn-google">
          <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        By continuing, you agree to our{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#" className="underline underline-offset-4 hover:text-foreground">
          Privacy Policy
        </a>
        .
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";
