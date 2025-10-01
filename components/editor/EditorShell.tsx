"use client";

import Link from "next/link";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import styles from "./EditorShell.module.css";
import { AccountPanel } from "./AccountPanel";

export type EditorTheme = "day" | "night";

type EditorThemeContextValue = {
  readonly theme: EditorTheme;
  readonly accentColor: string;
  readonly toggleTheme: () => void;
};

const EditorThemeContext = createContext<EditorThemeContextValue | null>(null);

function createContextError() {
  throw new Error("useEditorTheme must be used within an EditorShell");
}

export const useEditorTheme = () => useContext(EditorThemeContext) ?? createContextError();

type EditorShellProps = {
  readonly sidebar: ReactNode;
  readonly children: ReactNode;
};

export default function EditorShell({ sidebar, children }: EditorShellProps) {
  const [theme, setTheme] = useState<EditorTheme>("night");
  const accentColor = "#d4afe3";
  const themeClass = theme === "night" ? styles.night : styles.day;

  const value = useMemo<EditorThemeContextValue>(
    () => ({
      theme,
      accentColor,
      toggleTheme: () => setTheme((mode) => (mode === "night" ? "day" : "night")),
    }),
    [theme],
  );

  return (
    <EditorThemeContext.Provider value={value}>
      <div
        className={`${styles.shell} ${themeClass} flex min-h-screen flex-col font-mono transition-colors duration-500`}
        style={{ "--accent": accentColor } as CSSProperties}
      >
        <header
          className="border-b border-[var(--editor-border)] px-8 py-6 backdrop-blur"
          style={{ backgroundColor: "var(--editor-sidebar-bg)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-6">
            <Link
              href="/home"
              className="barcode-logo text-4xl uppercase transition-colors hover:text-[var(--accent)]"
              style={{ color: accentColor }}
            >
              D. kline
            </Link>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[color:var(--editor-muted)]">
              <button
                type="button"
                onClick={value.toggleTheme}
                aria-label="Toggle day and night theme"
                className="flex h-10 w-10 items-center justify-center rounded-md border border-[var(--editor-border)] text-base transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <span aria-hidden>{theme === "night" ? "☀" : "☾"}</span>
              </button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 overflow-hidden">
          <aside
            className="flex w-64 min-w-[15rem] flex-col border-r border-[var(--editor-border)]"
            style={{ backgroundColor: "var(--editor-sidebar-bg)" }}
          >
            <div className="flex-1 overflow-y-auto px-2 py-6 sm:px-3">{sidebar}</div>
          </aside>
          <main className="flex-1 overflow-y-auto px-10 py-10">
            <div className="mx-auto w-full max-w-4xl space-y-8 pb-24">{children}</div>
          </main>
        </div>
      </div>
    </EditorThemeContext.Provider>
  );
}
