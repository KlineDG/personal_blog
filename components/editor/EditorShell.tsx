"use client";

import type { CSSProperties, ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

export type EditorTheme = "day" | "night";

type EditorTokens = {
  readonly page: string;
  readonly nav: string;
  readonly navPlaceholderBorder: string;
  readonly toggle: string;
  readonly subtle: string;
  readonly sidebar: string;
  readonly sidebarHeading: string;
  readonly sidebarItem: string;
  readonly sidebarItemActive: string;
  readonly input: string;
  readonly surface: string;
  readonly surfaceHover: string;
  readonly buttonPrimary: string;
  readonly buttonSecondary: string;
  readonly muted: string;
  readonly main: string;
};

type EditorShellTokens = Record<EditorTheme, EditorTokens>;

type EditorThemeContextValue = {
  readonly theme: EditorTheme;
  readonly tokens: EditorTokens;
  readonly accentColor: string;
  readonly accentHoverColor: string;
  readonly toggleTheme: () => void;
};

type EditorShellProps = {
  readonly children: ReactNode;
  readonly sidebar: ReactNode;
  readonly initialTheme?: EditorTheme;
};

const accentColor = "#d4afe3";
const accentHoverColor = "#e3c4f0";

const themeTokens: EditorShellTokens = {
  night: {
    page: "bg-[#050507] text-zinc-100",
    nav: "border-b border-white/10 bg-[rgba(8,8,12,0.65)] backdrop-blur",
    navPlaceholderBorder: "border-white/15",
    toggle:
      "border-white/20 text-zinc-300 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.12)] hover:text-[var(--accent)]",
    subtle: "text-zinc-500",
    sidebar: "border-r border-white/10 bg-[rgba(10,10,14,0.55)]",
    sidebarHeading: "text-zinc-300",
    sidebarItem:
      "border border-white/5 bg-transparent text-zinc-300 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.1)] hover:text-zinc-100",
    sidebarItemActive: "border-[var(--accent)] bg-[rgba(212,175,227,0.12)] text-zinc-100",
    input:
      "border-white/15 bg-black/40 text-zinc-100 placeholder:text-zinc-500 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0",
    surface: "border border-white/10 bg-[rgba(12,12,18,0.65)]",
    surfaceHover: "hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.12)]",
    buttonPrimary: "bg-[var(--accent)] text-[#0b0312] hover:bg-[var(--accent-hover)]",
    buttonSecondary:
      "border-white/20 text-zinc-200 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.12)] hover:text-[var(--accent)]",
    muted: "text-zinc-500",
    main: "bg-transparent",
  },
  day: {
    page: "bg-[#f7f4fb] text-zinc-900",
    nav: "border-b border-zinc-200 bg-white/90 backdrop-blur",
    navPlaceholderBorder: "border-zinc-300",
    toggle:
      "border-zinc-300 text-zinc-600 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.2)] hover:text-[var(--accent)]",
    subtle: "text-zinc-500",
    sidebar: "border-r border-zinc-200 bg-white/70",
    sidebarHeading: "text-zinc-700",
    sidebarItem:
      "border border-zinc-200 bg-white/80 text-zinc-600 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.18)] hover:text-zinc-800",
    sidebarItemActive: "border-[var(--accent)] bg-[rgba(212,175,227,0.2)] text-zinc-800",
    input:
      "border-zinc-300 bg-white text-zinc-800 placeholder:text-zinc-400 focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:ring-offset-0",
    surface: "border border-zinc-200 bg-white",
    surfaceHover: "hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.18)]",
    buttonPrimary: "bg-[var(--accent)] text-[#23122f] hover:bg-[var(--accent-hover)]",
    buttonSecondary:
      "border-zinc-300 text-zinc-600 hover:border-[var(--accent)] hover:bg-[rgba(212,175,227,0.2)] hover:text-[var(--accent)]",
    muted: "text-zinc-500",
    main: "bg-transparent",
  },
};

const EditorThemeContext = createContext<EditorThemeContextValue | null>(null);

export function useEditorTheme() {
  const context = useContext(EditorThemeContext);

  if (!context) {
    throw new Error("useEditorTheme must be used within an EditorShell");
  }

  return context;
}

export function EditorShell({
  children,
  sidebar,
  initialTheme = "night",
}: EditorShellProps) {
  const [theme, setTheme] = useState<EditorTheme>(initialTheme);
  const tokens = themeTokens[theme];
  const toggleTheme = () => setTheme((mode) => (mode === "night" ? "day" : "night"));

  const accentVariables = useMemo(
    () =>
      ({
        "--accent": accentColor,
        "--accent-hover": accentHoverColor,
      }) satisfies CSSProperties,
    [],
  );

  return (
    <EditorThemeContext.Provider
      value={{
        theme,
        tokens,
        accentColor,
        accentHoverColor,
        toggleTheme,
      }}
    >
      <div
        className={`min-h-screen transition-colors duration-500 ${tokens.page}`}
        style={accentVariables}
      >
        <div className="flex min-h-screen flex-col font-mono">
          <header className={`sticky top-0 z-20 flex items-center justify-between px-8 py-5 ${tokens.nav}`}>
            <span className="barcode-logo text-3xl uppercase" style={{ color: accentColor }}>
              D. kline
            </span>
            <nav aria-hidden className="ml-10 hidden flex-1 items-center justify-center md:flex">
              <div
                className={`rounded-sm border border-dashed px-3 py-1 text-[0.65rem] uppercase tracking-[0.35em] opacity-70 ${tokens.subtle} ${tokens.navPlaceholderBorder}`}
              >
                Navigation
              </div>
            </nav>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Toggle day and night theme"
                className={`flex h-10 w-10 items-center justify-center rounded-sm border text-base transition-colors duration-300 ${tokens.toggle}`}
              >
                <span aria-hidden>{theme === "night" ? "☀" : "☾"}</span>
              </button>
            </div>
          </header>
          <div className={`flex flex-1`}> 
            <aside className={`hidden w-72 shrink-0 lg:flex ${tokens.sidebar}`}>
              <div className="flex h-full w-full flex-col gap-6 px-5 py-6">
                {sidebar}
              </div>
            </aside>
            <main className={`flex-1 px-6 py-8 sm:px-10 ${tokens.main}`}>
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </EditorThemeContext.Provider>
  );
}
