import Link from "next/link";
import { notFound } from "next/navigation";
import type { JSONContent } from "@tiptap/core";
import type { CSSProperties } from "react";

import ReadOnlyContent from "@/components/editor/ReadOnlyContent";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupabasePost = {
  readonly title: string | null;
  readonly slug: string;
  readonly content_json: JSONContent | null;
  readonly published_at: string | null;
  readonly excerpt?: string | null;
};

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

function buildIntro(post: SupabasePost): string {
  const raw = post.excerpt ?? "";
  const plain = raw || collectText(post.content_json ?? null);
  const normalized = plain.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }
  return normalized.length > 200 ? `${normalized.slice(0, 197).trimEnd()}…` : normalized;
}

type PostPageProps = {
  readonly params: Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("title,slug,content_json,published_at,excerpt")
    .eq("slug", slug)
    .eq("status", "published")
    .eq("is_deleted", false)
    .maybeSingle<SupabasePost>();

  if (error) {
    console.error("Failed to load post", error.message);
  }

  if (!data) {
    notFound();
  }

  const publishedAt = data.published_at ? new Date(data.published_at) : null;
  const intro = buildIntro(data);
  const accentStyle = { "--accent": "#d4afe3" } as CSSProperties;

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100" style={accentStyle}>
      <div className="mx-auto flex max-w-3xl flex-col gap-10 px-6 pb-24 pt-12 sm:px-8 sm:pt-16">
        <nav className="flex items-center justify-between text-sm text-zinc-400">
          <Link href="/home" className="barcode-logo text-3xl uppercase" style={{ color: "#d4afe3" }}>
            D. kline
          </Link>
          <Link
            href="/home"
            aria-label="Back to home"
            title="Back to home"
            className="group flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-zinc-200 transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          >
            <span aria-hidden className="text-lg transition-transform duration-200 group-hover:-translate-x-1">
              ←
            </span>
          </Link>
        </nav>
        <header className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {data.title ?? "Untitled"}
          </h1>
          {publishedAt && (
            <p className="text-sm uppercase tracking-[0.35em] text-zinc-500">
              {publishedAt.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          {intro && <p className="text-base text-zinc-400">{intro}</p>}
        </header>
        <article className="prose prose-invert prose-lg max-w-none">
          <ReadOnlyContent content={data.content_json ?? null} />
        </article>
      </div>
    </div>
  );
}
