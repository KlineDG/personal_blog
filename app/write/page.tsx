"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import ThumbnailGrid, { type ThumbnailGridItem } from "@/components/write/ThumbnailGrid";

import { createClient } from "@/lib/supabase/client";

type PostStatus = "draft" | "published";

type SupabasePost = {
  readonly id: string;
  readonly title: string | null;
  readonly slug: string;
  readonly status: PostStatus;
  readonly updated_at: string | null;
  readonly created_at: string | null;
  readonly excerpt?: string | null;
  readonly content_json?: JSONContent | null;
  readonly published_at?: string | null;
  readonly tags?: string[] | null;
  readonly thumbnail_url?: string | null;
  readonly thumbnail_alt?: string | null;
};

const FALLBACK_THUMBNAILS: readonly ThumbnailGridItem["thumbnail"][] = [
  {
    src: "/thumbnails/ideas-flow.svg",
    alt: "Abstract wave lines over a lavender and blue gradient background",
    width: 800,
    height: 600,
    priority: true,
  },
  {
    src: "/thumbnails/morning-pages.svg",
    alt: "Sunrise gradient with stylised mountain layers",
    width: 800,
    height: 600,
  },
  {
    src: "/thumbnails/notebook-atlas.svg",
    alt: "Notebook grid with colourful connecting routes",
    width: 800,
    height: 600,
  },
  {
    src: "/thumbnails/soundtrack-notes.svg",
    alt: "Night sky gradient with neon waveform arcs",
    width: 800,
    height: 600,
  },
];

type PostCard = ThumbnailGridItem & {
  readonly id: string;
  readonly status: PostStatus;
};

const DEFAULT_EXCERPT = "No summary yet. Open the post to start writing.";

function collectText(node: JSONContent | null | undefined): string {
  if (!node) return "";
  if (typeof node.text === "string") {
    return node.text;
  }
  if (!Array.isArray(node.content)) {
    return "";
  }
  return node.content.map((child) => collectText(child as JSONContent)).join(" ");
}

function toExcerpt(post: SupabasePost): string {
  const fallback = post.excerpt ?? "";
  const plain = fallback || collectText(post.content_json ?? null);
  if (!plain) {
    return DEFAULT_EXCERPT;
  }
  const trimmed = plain.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    return DEFAULT_EXCERPT;
  }
  return trimmed.length > 160 ? `${trimmed.slice(0, 157).trimEnd()}…` : trimmed;
}

const DEFAULT_REMOTE_THUMBNAIL_WIDTH = 1600;
const DEFAULT_REMOTE_THUMBNAIL_HEIGHT = 900;

function normaliseTags(tags: SupabasePost["tags"]): readonly string[] {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === "string")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function resolveThumbnail(
  post: SupabasePost,
  title: string,
  fallback: ThumbnailGridItem["thumbnail"],
): ThumbnailGridItem["thumbnail"] {
  if (typeof post.thumbnail_url === "string" && post.thumbnail_url.trim().length > 0) {
    const alt = typeof post.thumbnail_alt === "string" && post.thumbnail_alt.trim().length > 0
      ? post.thumbnail_alt.trim()
      : `Cover image for ${title}`;

    return {
      src: post.thumbnail_url,
      alt,
      width: DEFAULT_REMOTE_THUMBNAIL_WIDTH,
      height: DEFAULT_REMOTE_THUMBNAIL_HEIGHT,
    };
  }

  return { ...fallback };
}

function formatUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) return "Never opened";
  const date = new Date(updatedAt);
  if (Number.isNaN(date.getTime())) return "Never opened";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function WriteIndex() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const isMounted = useRef(true);
  const [posts, setPosts] = useState<PostCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadPosts = useCallback(async () => {
    if (!isMounted.current) return;
    setLoading(true);
    setError(null);

    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    if (authError || !user) {
      if (!isMounted.current) return;
      setError("Sign in first.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .select(
        "id,title,slug,status,updated_at,created_at,excerpt,content_json,published_at,tags,thumbnail_url,thumbnail_alt",
      )
      .eq("author_id", user.id)
      .eq("is_deleted", false)
      .order("updated_at", { ascending: false })
      .limit(100)
      .returns<SupabasePost[]>();

    if (!isMounted.current) return;

    if (error) {
      setError(error.message);
      setPosts([]);
      setLoading(false);
      return;
    }

    const normalized = (data ?? []).map((post, index) => {
      const title = (post.title ?? "Untitled").trim() || "Untitled";
      const fallbackThumbnail = FALLBACK_THUMBNAILS[index % FALLBACK_THUMBNAILS.length];
      const thumbnail = resolveThumbnail(post, title, fallbackThumbnail);
      const tags = normaliseTags(post.tags);

      return {
        id: post.id,
        title,
        slug: post.slug,
        status: post.status,
        updatedAt: post.updated_at ?? post.created_at ?? null,
        publishedAt: post.published_at ?? null,
        excerpt: toExcerpt(post),
        tags,
        thumbnail,
      } satisfies PostCard;
    });

    setPosts(normalized);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    const handleRefresh = () => {
      void loadPosts();
    };
    const handleDraftUpdated: EventListener = (event) => {
      const detail = (event as CustomEvent<Partial<PostCard> & { id: string }>).detail;
      if (!detail || !detail.id) {
        return;
      }
      setPosts((prev) =>
        prev.map((post) =>
          post.id === detail.id
            ? {
                ...post,
                title: typeof detail.title === "string" && detail.title.trim().length > 0 ? detail.title : post.title,
                slug: typeof detail.slug === "string" && detail.slug.length > 0 ? detail.slug : post.slug,
              }
            : post,
        ),
      );
    };

    window.addEventListener("editor:refresh-drafts", handleRefresh);
    window.addEventListener("editor:draft-updated", handleDraftUpdated);
    return () => {
      window.removeEventListener("editor:refresh-drafts", handleRefresh);
      window.removeEventListener("editor:draft-updated", handleDraftUpdated);
    };
  }, [loadPosts]);

  const handleCreateDraft = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    setError(null);

    const { data: auth, error: authError } = await supabase.auth.getUser();
    const user = auth?.user ?? null;
    if (authError || !user) {
      if (isMounted.current) {
        setError("Sign in first.");
        setCreating(false);
      }
      return;
    }

    const title = "Untitled";
    const slug = `untitled-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        title,
        slug,
        status: "draft",
        content_json: { type: "doc", content: [{ type: "paragraph" }] },
      })
      .select("slug")
      .single();

    if (!isMounted.current) {
      return;
    }

    if (error || !data) {
      setError(error?.message ?? "Unable to create draft.");
      setCreating(false);
      return;
    }

    router.push(`/write/${data.slug}`);
  }, [creating, router, supabase]);

  const handleRetry = useCallback(() => {
    void loadPosts();
  }, [loadPosts]);

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[color:var(--editor-page-text)]">Your posts</h1>
          <p className="text-sm text-[color:var(--editor-muted)]">
            Select a draft to continue writing or create something new.
          </p>
        </div>
        <button
          type="button"
          onClick={handleCreateDraft}
          disabled={creating}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-[var(--accent)] px-4 text-sm font-medium text-[color:var(--accent)] transition-colors hover:bg-[color:color-mix(in_srgb,var(--accent)_12%,transparent)] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {creating ? "Creating…" : "New draft"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-[color:var(--editor-danger)] bg-[color:color-mix(in_srgb,var(--editor-danger)_10%,transparent)] px-4 py-3 text-sm text-[color:var(--editor-danger)]">
          <div className="flex items-center justify-between gap-4">
            <span>{error}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="text-xs font-medium underline underline-offset-2 hover:text-[color:color-mix(in_srgb,var(--editor-danger)_65%,var(--editor-page-text)_35%)]"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] px-6 py-10 text-sm text-[color:var(--editor-muted)] shadow-[var(--editor-shadow)]">
          Loading drafts…
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--editor-border)] bg-[var(--editor-surface)] px-6 py-16 text-center text-sm text-[color:var(--editor-muted)] shadow-[var(--editor-shadow)]">
          You haven&apos;t created any drafts yet. Start by clicking <span className="font-medium text-[color:var(--accent)]">New draft</span>.
        </div>
      ) : (
        <section className="w-full flex flex-col gap-6 rounded-3xl border-none p-6 shadow-[var(--editor-shadow)] sm:p-8">
          <ThumbnailGrid items={posts} />
        </section>
      )}
    </div>
  );
}
