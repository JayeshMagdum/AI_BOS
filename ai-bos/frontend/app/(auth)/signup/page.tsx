/**
 * app/(auth)/signup/page.tsx
 *
 * Dedicated Sign-up route for AI BOS.
 * Pre-selects the registration view and links smoothly with /login.
 */
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, signup } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, forward to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const email = (form.get("email") as string)?.trim();
    const password = form.get("password") as string;
    const fullName = (form.get("fullname") as string)?.trim();

    try {
      await signup(email, password, fullName);
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.detail);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong during account creation.");
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Brand ─────────────────────────────────── */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary mb-4 shadow-md shadow-primary/30">
          <Layers className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">AI BOS</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your enterprise workspace account
        </p>
      </div>

      {/* ── Card ──────────────────────────────────── */}
      <div className="rounded-3xl border border-white/20 dark:border-white/10 bg-white/70 dark:bg-black/60 backdrop-blur-2xl shadow-ios dark:shadow-ios-dark p-8">
        {/* Switcher header */}
        <div className="flex rounded-xl bg-black/5 dark:bg-white/10 p-1 mb-7 backdrop-blur-md">
          <Link
            href="/login"
            className="flex-1 text-center rounded-lg py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 ease-ios-spring"
          >
            Sign in
          </Link>
          <div className="flex-1 text-center rounded-lg py-1.5 text-sm font-medium bg-background text-foreground shadow-sm transition-all duration-300 ease-ios-spring">
            Create account
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div
            id="auth-error-banner"
            className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full name */}
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

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Work Email
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
                autoComplete="new-password"
                required
                minLength={8}
                placeholder="At least 8 characters"
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

          {/* Submit button */}
          <Button
            type="submit"
            className="w-full mt-2"
            disabled={submitting}
            id="btn-signup"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating account…
              </>
            ) : (
              "Get started free"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline underline-offset-4">
            Sign in
          </Link>
        </div>
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
  "w-full rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-inner px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300";
