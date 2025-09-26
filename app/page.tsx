"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  isSupabaseConfigured,
  signInWithPassword,
  signUpWithPassword,
  type SupabaseSession,
  upsertProfile,
} from "../lib/supabase";

type AuthMode = "signin" | "signup";

type FormState = {
  email: string;
  password: string;
  confirmPassword: string;
};

const accentColor = "#d4afe3";

function persistSession(session: SupabaseSession) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("sb-access-token", session.access_token);
  window.localStorage.setItem("sb-refresh-token", session.refresh_token);
  window.localStorage.setItem("sb-user-id", session.user.id);
  if (session.user.email) {
    window.localStorage.setItem("sb-user-email", session.user.email);
  }
}

function resetSessionStorage() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem("sb-access-token");
  window.localStorage.removeItem("sb-refresh-token");
  window.localStorage.removeItem("sb-user-id");
  window.localStorage.removeItem("sb-user-email");
}

export default function AuthGateway() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [form, setForm] = useState<FormState>({ email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const existingToken = window.localStorage.getItem("sb-access-token");
    if (existingToken) {
      router.replace("/home");
    }
  }, [router]);

  const updateField = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const toggleMode = () => {
    setMode((current) => (current === "signin" ? "signup" : "signin"));
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!supabaseReady) {
      setError("Supabase credentials are not configured. Update your environment variables and try again.");
      return;
    }

    if (mode === "signup" && form.password !== form.confirmPassword) {
      setError("Passwords do not match. Please confirm your password.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "signin") {
        const session = await signInWithPassword(form.email, form.password);
        persistSession(session);
        router.replace("/home");
        return;
      }

      const { session, user, requiresEmailConfirmation } = await signUpWithPassword(form.email, form.password);

      if (requiresEmailConfirmation) {
        setInfo(
          "Check your inbox to confirm the sign-up. You'll be able to log in after verifying your email address.",
        );
        resetSessionStorage();
        return;
      }

      if (!session) {
        throw new Error("Supabase did not return a session for the new user.");
      }

      const profileId = session.user.id || user?.id;
      if (!profileId) {
        throw new Error("Unable to resolve the new user's identifier.");
      }

      await upsertProfile(session.access_token, {
        id: profileId,
        email: user?.email ?? form.email,
      });

      persistSession(session);
      router.replace("/home");
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestAccess = () => {
    router.replace("/home");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#07070c] px-6 py-12 text-zinc-100">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(212,175,227,0.18),_rgba(7,7,12,0.95))]" />
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--accent,_#d4afe3)] to-transparent" />
        <div className="space-y-8 px-10 pb-12 pt-14">
          <div className="space-y-3 text-center">
            <p className="barcode-logo text-4xl uppercase tracking-widest" style={{ color: accentColor }}>
              D. kline
            </p>
            <h1 className="text-2xl font-semibold">Welcome back</h1>
            <p className="text-sm text-zinc-400">
              Sign in to pick up where you left off, create a new account, or continue as a guest to explore the journal.
            </p>
          </div>

          {!supabaseReady && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-200">
              Supabase keys are missing. Provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable
              authentication.
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
          )}

          {info && (
            <div className="rounded-lg border border-[var(--accent,_#d4afe3)]/40 bg-[var(--accent,_#d4afe3)]/10 p-3 text-sm text-zinc-100">
              {info}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.4em] text-zinc-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={updateField("email")}
                className="h-12 w-full rounded-md border border-white/10 bg-black/40 px-4 text-sm text-zinc-100 outline-none transition focus:border-[var(--accent,_#d4afe3)] focus:ring-2 focus:ring-[var(--accent,_#d4afe3)]/30"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-[0.4em] text-zinc-400" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={updateField("password")}
                className="h-12 w-full rounded-md border border-white/10 bg-black/40 px-4 text-sm text-zinc-100 outline-none transition focus:border-[var(--accent,_#d4afe3)] focus:ring-2 focus:ring-[var(--accent,_#d4afe3)]/30"
                placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                minLength={6}
              />
            </div>

            {mode === "signup" && (
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-[0.4em] text-zinc-400" htmlFor="confirmPassword">
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={updateField("confirmPassword")}
                  className="h-12 w-full rounded-md border border-white/10 bg-black/40 px-4 text-sm text-zinc-100 outline-none transition focus:border-[var(--accent,_#d4afe3)] focus:ring-2 focus:ring-[var(--accent,_#d4afe3)]/30"
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[var(--accent,_#d4afe3)] px-4 text-sm font-semibold text-[#1f0b2a] transition hover:bg-[#e3c4f0] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting && (
              <span
                aria-hidden
                className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-[#1f0b2a]/30 border-r-transparent"
              />
            )}
              {mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>{mode === "signin" ? "Need an account?" : "Already have an account?"}</span>
            <button
              type="button"
              onClick={toggleMode}
              className="font-medium text-[var(--accent,_#d4afe3)] transition hover:text-white"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.35em] text-zinc-500">
              <span className="h-px flex-1 bg-white/10" />
              <span>or</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <button
              type="button"
              onClick={handleGuestAccess}
              className="h-12 w-full rounded-md border border-white/15 bg-transparent text-sm font-medium text-zinc-100 transition hover:border-[var(--accent,_#d4afe3)] hover:text-[var(--accent,_#d4afe3)]"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
