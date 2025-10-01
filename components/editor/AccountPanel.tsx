"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import { useEditorTheme } from "./EditorShell";

type AccountSummary = {
  readonly name: string;
  readonly email: string;
};

export function AccountPanel() {
  const supabase = useMemo(() => createClient(), []);
  const { accentColor } = useEditorTheme();
  const [account, setAccount] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const user = data.user;
      if (!user) {
        setAccount(null);
      } else {
        const name =
          (user.user_metadata?.full_name as string | undefined)?.trim() ||
          (user.user_metadata?.name as string | undefined)?.trim() ||
          user.email ||
          "Signed in";
        setAccount({
          name,
          email: user.email ?? "",
        });
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [supabase]);

  const initials = useMemo(() => {
    if (!account?.name) return "?";
    const [first = "", second = ""] = account.name.split(" ");
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase() || first.charAt(0).toUpperCase() || "?";
  }, [account]);

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    window.location.href = "/";
  };

  const accountName = loading ? "Loading account…" : account?.name || "Guest";
  const accountEmail = loading ? "" : account?.email ?? "";

  return (
    <div className="space-y-4 text-sm text-[color:var(--editor-muted)]">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/account"
          className="group relative flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          style={{
            backgroundColor: "var(--editor-soft)",
            color: "var(--editor-page-text)",
            boxShadow: "var(--editor-shadow)",
          }}
        >
          <span aria-hidden>{initials}</span>
          <span className="pointer-events-none absolute left-full top-1/2 z-10 ml-3 min-w-[12rem] -translate-y-1/2 rounded-md border border-[var(--editor-border)] bg-[var(--editor-surface)] px-3 py-2 text-left text-xs font-medium text-[color:var(--editor-page-text)] opacity-0 shadow-[var(--editor-shadow)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="block text-sm font-semibold">{accountName}</span>
            {accountEmail && <span className="mt-1 block text-[0.7rem] text-[color:var(--editor-muted)]">{accountEmail}</span>}
          </span>
          <span className="sr-only">Open account</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--editor-border)] text-base transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          >
            <span aria-hidden>⚙</span>
            <span className="sr-only">Open settings</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--editor-border)] text-base transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            style={{ color: accentColor }}
          >
            <span aria-hidden>⎋</span>
            <span className="sr-only">Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
