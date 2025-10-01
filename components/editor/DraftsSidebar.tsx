"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useEditorTheme } from "@/components/editor/EditorShell";
import { createClient } from "@/lib/supabase/client";

type Draft = {
  readonly id: string;
  readonly title: string | null;
  readonly slug: string;
  readonly updated_at: string;
};

export default function DraftsSidebar() {
  const supabase = useMemo(() => createClient(), []);
  const [drafts, setDrafts] = useState<readonly Draft[]>([]);
  const [query, setQuery] = useState("");
  const { tokens } = useEditorTheme();
  const pathname = usePathname();

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,title,slug,updated_at")
        .eq("status", "draft")
        .eq("is_deleted", false)
        .order("updated_at", { ascending: false })
        .limit(50);

      setDrafts(data ?? []);
    })();
  }, [supabase]);

  const filteredDrafts = useMemo(
    () =>
      drafts.filter((draft) =>
        (draft.title ?? "Untitled").toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [drafts, query],
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div className={`rounded-md px-4 py-5 shadow-sm transition-colors duration-300 ${tokens.surface}`}>
        <div className="flex flex-col gap-3">
          <Link
            href="/write"
            className={`inline-flex items-center justify-center rounded-sm px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-colors duration-200 ${tokens.buttonPrimary}`}
          >
            New Post
          </Link>
          <label className="flex flex-col gap-2 text-xs font-medium uppercase tracking-[0.35em]">
            <span className={tokens.sidebarHeading}>Search drafts</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by title"
              className={`h-10 rounded-sm border px-3 text-sm tracking-wide transition-colors duration-200 ${tokens.input}`}
              type="search"
            />
          </label>
        </div>
      </div>

      <div className={`flex-1 overflow-y-auto rounded-md border px-2 py-3 transition-colors duration-300 ${tokens.surface}`}>
        <div className="space-y-2">
          {filteredDrafts.map((draft) => {
            const isActive = pathname?.startsWith(`/write/${draft.slug}`) ?? false;

            return (
              <Link
                key={draft.id}
                href={`/write/${draft.slug}`}
                className={`block rounded-sm px-3 py-2 text-left text-sm transition-colors duration-200 ${
                  isActive ? tokens.sidebarItemActive : tokens.sidebarItem
                }`}
              >
                <div className="flex flex-col">
                  <span className="truncate font-medium">
                    {draft.title && draft.title.trim().length > 0 ? draft.title : "Untitled"}
                  </span>
                  <span className={`text-xs ${tokens.muted}`}>
                    {new Date(draft.updated_at).toLocaleString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {filteredDrafts.length === 0 && (
          <p className={`mt-6 text-center text-sm ${tokens.muted}`}>No drafts yet.</p>
        )}
      </div>
    </div>
  );
}
