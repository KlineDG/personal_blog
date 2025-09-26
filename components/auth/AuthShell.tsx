"use client";

import type { CSSProperties, ReactNode } from "react";

export type AuthTheme = "day" | "night";

export type AuthShellProps = {
  readonly accentColor?: string;
  readonly theme: AuthTheme;
  readonly onToggleTheme: () => void;
  readonly children: ReactNode;
};

type ShellTokens = {
  readonly page: string;
  readonly panel: string;
  readonly text: string;
  readonly subtle: string;
  readonly toggle: string;
};

const themeTokens: Record<AuthTheme, ShellTokens> = {
  night: {
    page: "bg-[#060608]",
    panel:
      "border border-white/12 bg-[rgba(6,6,8,0.65)] shadow-[0_30px_60px_-40px_rgba(0,0,0,0.85)] backdrop-blur",
    text: "text-zinc-100",
    subtle: "text-zinc-500",
    toggle:
      "border-white/20 text-zinc-300 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.12)] hover:text-[var(--accent)]",
  },
  day: {
    page: "bg-[#f7f5fb]",
    panel: "border border-zinc-300 bg-white shadow-[0_18px_45px_-35px_rgba(24,16,32,0.65)]",
    text: "text-zinc-900",
    subtle: "text-zinc-500",
    toggle:
      "border-zinc-300 text-zinc-600 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.16)] hover:text-[var(--accent)]",
  },
};

export function AuthShell({
  accentColor = "#d4afe3",
  theme,
  onToggleTheme,
  children,
}: AuthShellProps) {
  const tokens = themeTokens[theme];

  return (
    <main
      className={`flex min-h-screen flex-col font-mono transition-colors duration-500 ${tokens.page} ${tokens.text}`}
      style={{ "--accent": accentColor } as CSSProperties}
    >
      <header className="mx-auto mt-10 flex w-full max-w-4xl items-center justify-between px-6 py-3">
        <span className="barcode-logo text-4xl uppercase" style={{ color: accentColor }}>
          D. kline
        </span>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle day and night theme"
          className={`flex h-10 w-10 items-center justify-center rounded-sm border text-base transition-colors duration-300 ${
            tokens.toggle
          }`}
        >
          <span aria-hidden>{theme === "night" ? "☀" : "☾"}</span>
        </button>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-10 sm:px-10">
        <div className={`w-full max-w-xl rounded-sm ${tokens.panel} px-8 py-10 sm:px-12 lg:max-w-2xl`}>
          {children}
        </div>
      </div>
    </main>
  );
}
