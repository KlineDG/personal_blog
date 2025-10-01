"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { useEditorTheme } from "./EditorShell";

type DraftSummary = {
  readonly id: string;
  readonly title: string | null;
  readonly slug: string;
  readonly updated_at: string | null;
};

type DraftEventDetail = {
  readonly id: string;
  readonly title?: string;
  readonly slug?: string;
};

const toTitle = (title: string | null) => (title && title.trim().length > 0 ? title : "Untitled draft");

export default function DraftsSidebar() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const { accentColor } = useEditorTheme();
  const [drafts, setDrafts] = useState<readonly DraftSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDrafts = useMemo(
    () =>
      async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id,title,slug,updated_at")
          .eq("status", "draft")
          .eq("is_deleted", false)
          .order("updated_at", { ascending: false })
          .limit(100);
        if (!error) {
          setDrafts(data ?? []);
        }
        setLoading(false);
      },
    [supabase],
  );

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  useEffect(() => {
    const onRefresh = () => fetchDrafts();
    const onDraftUpdated: EventListener = (event) => {
      const detail = (event as CustomEvent<DraftEventDetail>).detail;
      if (!detail) return;
      setDrafts((prev) =>
        prev.map((draft) => (draft.id === detail.id ? { ...draft, ...detail } : draft)),
      );
    };

    window.addEventListener("editor:refresh-drafts", onRefresh);
    window.addEventListener("editor:draft-updated", onDraftUpdated);
    return () => {
      window.removeEventListener("editor:refresh-drafts", onRefresh);
      window.removeEventListener("editor:draft-updated", onDraftUpdated);
    };
  }, [fetchDrafts]);

  const filteredDrafts = drafts.filter((draft) =>
    toTitle(draft.title).toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="space-y-4 rounded-xl border border-[var(--editor-border)] px-4 py-5 shadow-[var(--editor-shadow)]" style={{ backgroundColor: "var(--editor-surface)" }}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-[color:var(--editor-muted)]">
            Drafts
          </h2>
          <Link
            href="/write"
            className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#1f0b2a] shadow-[0_12px_24px_-18px_rgba(212,175,227,0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          >
            New
          </Link>
        </div>
        <label className="block text-[0.7rem] uppercase tracking-[0.3em] text-[color:var(--editor-muted)]">
          <span className="sr-only">Search drafts</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search drafts"
            className="mt-2 w-full rounded-md border border-[var(--editor-input-border)] bg-[var(--editor-input-bg)] px-3 py-2 text-[0.8rem] text-[color:var(--editor-page-text)] placeholder:text-[color:var(--editor-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-opacity-40"
            type="search"
          />
        </label>
      </div>
      <nav className="flex-1 overflow-y-auto pr-2">
        <ul className="space-y-2">
          {loading && (
            <li className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-soft)] px-4 py-3 text-xs text-[color:var(--editor-muted)]">
              Loading drafts…
            </li>
          )}
          {!loading && filteredDrafts.length === 0 && (
            <li className="rounded-lg border border-[var(--editor-border)] bg-[var(--editor-soft)] px-4 py-3 text-xs text-[color:var(--editor-muted)]">
              No drafts yet. Start something new.
            </li>
          )}
          {filteredDrafts.map((draft) => {
            const isActive = pathname?.includes(`/write/${draft.slug}`);
            const updatedLabel = draft.updated_at
              ? new Date(draft.updated_at).toLocaleString()
              : "Never saved";
            return (
              <li key={draft.id}>
                <Link
                  href={`/write/${draft.slug}`}
                  className="group block rounded-xl border border-[var(--editor-border)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
                  style={
                    isActive
                      ? {
                          borderColor: accentColor,
                          backgroundColor: "var(--editor-soft)",
                          color: accentColor,
                        }
                      : undefined
                  }
                >
                  <p className="truncate text-sm font-semibold text-[color:var(--editor-page-text)] group-hover:text-[var(--accent)]" style={isActive ? { color: accentColor } : undefined}>
                    {toTitle(draft.title)}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--editor-muted)]">{updatedLabel}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
