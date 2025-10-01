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

  return (
    <div className="space-y-4 text-sm text-[color:var(--editor-muted)]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full text-base font-semibold"
          style={{
            backgroundColor: "var(--editor-soft)",
            color: "var(--editor-page-text)",
            boxShadow: "var(--editor-shadow)",
          }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--editor-page-text)]">
            {loading ? "Loading account…" : account?.name || "Guest"}
          </p>
          {account?.email && <p className="truncate text-xs">{account.email}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.28em] text-[color:var(--editor-muted)]">
        <Link
          href="/settings"
          className="rounded-md border border-[var(--editor-border)] px-3 py-2 text-center transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
        >
          Settings
        </Link>
        <Link
          href="/account"
          className="rounded-md border border-[var(--editor-border)] px-3 py-2 text-center transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
        >
          Account
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-[var(--editor-border)] px-3 py-2 text-center transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          style={{ color: accentColor }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
