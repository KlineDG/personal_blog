import { cache, type CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PostContent from "@/components/post/PostContent";
import { mapRowToPostCard, type PostDetailRow } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

const accentColor = "#d4afe3";
const accentVariables: CSSProperties = { ["--accent" as "--accent"]: accentColor };

const getPublishedPost = cache(async (slug: string) => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,content_json,published_at,reading_time,category,tags")
    .eq("slug", slug)
    .eq("status", "published")
    .is("is_deleted", false)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as PostDetailRow | null) ?? null;
});

type PostPageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = params;
  const post = await getPublishedPost(slug);

  if (!post) {
    return {
      title: "Post not found",
    };
  }

  const summary = mapRowToPostCard(post);

  return {
    title: summary.title,
    description: post.excerpt ?? undefined,
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = params;
  const post = await getPublishedPost(slug);

  if (!post) {
    notFound();
  }

  const summary = mapRowToPostCard(post);

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-zinc-100">
      <article className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-16 sm:px-8">
        <Link
          href="/home"
          className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-400 transition-colors hover:text-zinc-200"
        >
          ← Back to journal
        </Link>
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-zinc-400">
            {summary.category && <span>{summary.category}</span>}
            {post.tags?.length ? <span className="text-zinc-500">•</span> : null}
            {post.tags?.length ? (
              <span className="flex flex-wrap gap-2 text-[0.65rem] normal-case">
                {post.tags.map((tag) => (
                  <span key={tag} className="rounded-sm border border-zinc-700 px-2 py-1 text-zinc-300">
                    {tag}
                  </span>
                ))}
              </span>
            ) : null}
          </div>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{summary.title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <time dateTime={summary.isoDate}>{summary.date}</time>
            {summary.readingTime && (
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-zinc-500" />
                {summary.readingTime}
              </span>
            )}
          </div>
        </header>
        <div
          className="h-[1px] w-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
          style={accentVariables}
        />
        <PostContent content={post.content_json} />
      </article>
    </div>
  );
}
