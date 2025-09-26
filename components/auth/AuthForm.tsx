import type { ChangeEvent, FormEvent } from "react";

import type { AuthTheme } from "./AuthShell";

export type AuthMode = "signin" | "signup";

type FormState = {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
};

type AuthFormProps = {
  readonly mode: AuthMode;
  readonly theme: AuthTheme;
  readonly form: FormState;
  readonly isSubmitting: boolean;
  readonly supabaseReady: boolean;
  readonly error: string | null;
  readonly info: string | null;
  readonly onFieldChange: (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => void;
  readonly onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void> | void;
  readonly onToggleMode: () => void;
  readonly onGuestAccess: () => void;
};

type ThemeTokens = {
  readonly field: string;
  readonly label: string;
  readonly submit: string;
  readonly outline: string;
  readonly ghost: string;
  readonly supabase: string;
  readonly error: string;
  readonly info: string;
  readonly spinner: string;
};

const themeTokens: Record<AuthTheme, ThemeTokens> = {
  night: {
    field:
      "border border-white/12 bg-[rgba(10,10,16,0.82)] px-4 py-3 text-sm text-zinc-100 transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40 placeholder:text-zinc-500",
    label: "text-[10px] uppercase tracking-[0.4em] text-zinc-500",
    submit:
      "flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[var(--accent)] px-4 text-sm font-semibold text-[#120813] transition hover:bg-[#e6d4f0] disabled:cursor-wait disabled:opacity-70",
    outline:
      "inline-flex h-11 w-full items-center justify-center rounded-sm border border-white/18 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-300 transition hover:border-[var(--accent)] hover:text-[var(--accent)]",
    ghost:
      "inline-flex h-11 w-full items-center justify-center rounded-sm border border-white/12 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-400 transition hover:border-[var(--accent)] hover:text-[var(--accent)]",
    supabase:
      "rounded-sm border border-amber-400/70 bg-amber-400/10 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-amber-200",
    error: "rounded-sm border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-100",
    info: "rounded-sm border border-[var(--accent)]/40 bg-[rgba(212,175,227,0.14)] px-4 py-3 text-sm text-zinc-100",
    spinner: "border-zinc-900/20",
  },
  day: {
    field:
      "border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/30 placeholder:text-zinc-400",
    label: "text-[10px] uppercase tracking-[0.4em] text-zinc-500",
    submit:
      "flex h-11 w-full items-center justify-center gap-2 rounded-sm bg-[var(--accent)] px-4 text-sm font-semibold text-[#1f0b2a] transition hover:bg-[#e7d8f1] disabled:cursor-wait disabled:opacity-70",
    outline:
      "inline-flex h-11 w-full items-center justify-center rounded-sm border border-zinc-300 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]",
    ghost:
      "inline-flex h-11 w-full items-center justify-center rounded-sm border border-zinc-400 text-[11px] font-medium uppercase tracking-[0.35em] text-zinc-600 transition hover:border-[var(--accent)] hover:text-[var(--accent)]",
    supabase:
      "rounded-sm border border-amber-500/50 bg-amber-500/10 px-4 py-3 text-[11px] uppercase tracking-[0.3em] text-amber-700",
    error: "rounded-sm border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-600",
    info: "rounded-sm border border-[var(--accent)]/40 bg-[rgba(212,175,227,0.12)] px-4 py-3 text-sm text-zinc-700",
    spinner: "border-zinc-100/40",
  },
};

export function AuthForm({
  mode,
  theme,
  form,
  isSubmitting,
  supabaseReady,
  error,
  info,
  onFieldChange,
  onSubmit,
  onToggleMode,
  onGuestAccess,
}: AuthFormProps) {
  const tokens = themeTokens[theme];

  return (
    <section className="space-y-6">
      {!supabaseReady && (
        <div className={tokens.supabase}>
          Supply NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable auth.
        </div>
      )}

      {error && <div className={tokens.error}>{error}</div>}

      {info && <div className={tokens.info}>{info}</div>}

      <form className="space-y-5" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <label className={tokens.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={onFieldChange("email")}
            className={tokens.field}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <label className={tokens.label} htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={onFieldChange("password")}
            className={tokens.field}
            placeholder="••••••••"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={6}
          />
        </div>

        {mode === "signup" && (
          <div className="space-y-2">
            <label className={tokens.label} htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              value={form.confirmPassword}
              onChange={onFieldChange("confirmPassword")}
              className={tokens.field}
              placeholder="Repeat your password"
              autoComplete="new-password"
              minLength={6}
            />
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={tokens.submit}>
          {isSubmitting && (
            <span
              aria-hidden
              className={`inline-flex h-4 w-4 animate-spin rounded-full border-2 ${tokens.spinner} border-r-transparent`}
            />
          )}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="space-y-3">
        <button type="button" onClick={onToggleMode} className={tokens.outline}>
          {mode === "signin" ? "Create account" : "Use existing"}
        </button>
        <button type="button" onClick={onGuestAccess} className={tokens.ghost}>
          Continue as guest
        </button>
      </div>
    </section>
  );
}
