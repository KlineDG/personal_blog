"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { AuthForm, type AuthMode } from "../components/auth/AuthForm";
import { AuthShell, type AuthTheme } from "../components/auth/AuthShell";
import {
  isSupabaseConfigured,
  signInWithPassword,
  signUpWithPassword,
  type SupabaseSession,
  upsertProfile,
} from "../lib/supabase";

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
  const [theme, setTheme] = useState<AuthTheme>("night");
  const [form, setForm] = useState<FormState>({ email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const supabaseReady = useMemo(() => isSupabaseConfigured(), []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(prefersDark.matches ? "night" : "day");
    }
  }, []);

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
    <AuthShell
      accentColor={accentColor}
      theme={theme}
      onToggleTheme={() => setTheme((current) => (current === "night" ? "day" : "night"))}
    >
      <AuthForm
        mode={mode}
        theme={theme}
        form={form}
        isSubmitting={isSubmitting}
        supabaseReady={supabaseReady}
        error={error}
        info={info}
        onFieldChange={updateField}
        onSubmit={handleSubmit}
        onToggleMode={toggleMode}
        onGuestAccess={handleGuestAccess}
      />
    </AuthShell>
  );
}
