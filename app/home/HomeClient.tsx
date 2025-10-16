"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState, type CSSProperties } from "react";
import { Bookmark, Moon, Sun, ThumbsDown, ThumbsUp } from "lucide-react";
import type { JSONContent } from "@tiptap/core";

import { PostCard, type PostCardPost, type PostCardTheme } from "@/components/PostCard";

const accentColor = "#d4afe3";
const accentHoverColor = "#e3c4f0";

type ThemeConfig = PostCardTheme & {
  readonly page: string;
  readonly input: string;
};

type SupabasePost = {
  readonly id: string;
  readonly title: string | null;
  readonly slug: string;
  readonly excerpt?: string | null;
  readonly content_json?: JSONContent | null;
  readonly category?: string | null;
  readonly tags?: string[] | string | null;
  readonly reading_time?: string | null;
  readonly readingTime?: string | null;
  readonly published_at?: string | null;
  readonly updated_at?: string | null;
  readonly thumbnail_url?: string | null;
  readonly thumbnail_alt?: string | null;
};

type HomeClientProps = {
  readonly posts: readonly SupabasePost[];
};

type ReactionState = {
  readonly liked: boolean;
  readonly disliked: boolean;
  readonly bookmarked: boolean;
};

const EMPTY_REACTION_STATE: ReactionState = {
  liked: false,
  disliked: false,
  bookmarked: false,
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

function extractExcerpt(content: JSONContent | null | undefined, fallback: string | null | undefined): string {
  const plain = collectText(content).replace(/\s+/g, " ").trim();
  const base = fallback ?? plain;
  if (!base) return "";
  return base.length > 200 ? `${base.slice(0, 200).trimEnd()}…` : base;
}

function normalizeTags(tags: SupabasePost["tags"]): readonly string[] | undefined {
  if (!tags) {
    return undefined;
  }

  if (Array.isArray(tags)) {
    const normalised = tags
      .filter((tag): tag is string => typeof tag === "string")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return normalised.length > 0 ? normalised : undefined;
  }

  if (typeof tags === "string") {
    const normalised = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return normalised.length > 0 ? normalised : undefined;
  }

  return undefined;
}

function normalizePost(post: SupabasePost): PostCardPost {
  const publishedAt = post.published_at ?? post.updated_at ?? null;
  const thumbnailUrl = typeof post.thumbnail_url === "string" ? post.thumbnail_url.trim() : "";
  const thumbnailAlt = typeof post.thumbnail_alt === "string" ? post.thumbnail_alt.trim() : "";
  return {
    title: post.title ?? "Untitled",
    slug: post.slug,
    excerpt: extractExcerpt(post.content_json ?? null, post.excerpt ?? null),
    category: post.category ?? undefined,
    tags: normalizeTags(post.tags),
    readingTime: post.readingTime ?? post.reading_time ?? undefined,
    publishedAt: publishedAt ?? undefined,
    thumbnail:
      thumbnailUrl.length > 0
        ? {
            src: thumbnailUrl,
            alt: thumbnailAlt.length > 0 ? thumbnailAlt : post.title ?? "Post thumbnail",
          }
        : undefined,
  };
}

export default function HomeClient({ posts }: HomeClientProps) {
  const normalizedPosts = useMemo(() => posts.map(normalizePost), [posts]);
  const featuredPost = normalizedPosts[0] ?? null;
  const recentPosts = normalizedPosts.slice(1);

  const [theme, setTheme] = useState<"day" | "night">("night");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const [reactions, setReactions] = useState<Record<string, ReactionState>>({});

  const accentVariables = useMemo(
    () =>
      ({
        "--accent": accentColor,
        "--accent-hover": accentHoverColor,
      }) satisfies CSSProperties,
    [],
  );

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          normalizedPosts
            .map((post) => post.category)
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    ],
    [normalizedPosts],
  );

  const themeStyles = useMemo<ThemeConfig>(
    () =>
      theme === "night"
        ? {
            page: "bg-[#0b0b0f] text-zinc-100",
            subtleText: "text-zinc-400",
            bodyText: "text-zinc-300",
            surface: "border-white/15 bg-white/5",
            border: "border-white/10",
            input:
              "border-b-white/25 bg-black/30 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 focus:outline-none",
            surfaceText: "text-zinc-200",
          }
        : {
            page: "bg-[#fdfbff] text-zinc-900",
            subtleText: "text-zinc-500",
            bodyText: "text-zinc-600",
            surface: "border-zinc-200 bg-white/90",
            border: "border-zinc-200",
            input:
              "border-b-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 focus:outline-none",
            surfaceText: "text-zinc-700",
          },
    [theme],
  );

  const filteredPosts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return recentPosts.filter((post) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [post.title, post.excerpt ?? ""].some((field) => field.toLowerCase().includes(normalizedQuery));
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [recentPosts, searchQuery, selectedCategory]);
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== "All";

  const toggleLike = useCallback((slug: string) => {
    setReactions((current) => {
      const previous = current[slug] ?? EMPTY_REACTION_STATE;
      const liked = !previous.liked;
      const next: ReactionState = {
        liked,
        disliked: liked ? false : previous.disliked,
        bookmarked: previous.bookmarked,
      };
      return { ...current, [slug]: next };
    });
  }, []);

  const toggleDislike = useCallback((slug: string) => {
    setReactions((current) => {
      const previous = current[slug] ?? EMPTY_REACTION_STATE;
      const disliked = !previous.disliked;
      const next: ReactionState = {
        liked: disliked ? false : previous.liked,
        disliked,
        bookmarked: previous.bookmarked,
      };
      return { ...current, [slug]: next };
    });
  }, []);

  const toggleBookmark = useCallback((slug: string) => {
    setReactions((current) => {
      const previous = current[slug] ?? EMPTY_REACTION_STATE;
      const bookmarked = !previous.bookmarked;
      const next: ReactionState = {
        liked: previous.liked,
        disliked: previous.disliked,
        bookmarked,
      };
      return { ...current, [slug]: next };
    });
  }, []);

  const buildActions = useCallback(
    (post: PostCardPost) => {
      const reaction = reactions[post.slug] ?? EMPTY_REACTION_STATE;
      const containerClasses =
        theme === "night"
          ? "border-white/10 bg-black/60 text-zinc-200"
          : "border-zinc-200 bg-white/85 text-zinc-700";
      const hoverClass = theme === "night" ? "hover:bg-white/10" : "hover:bg-zinc-100";
      const activeClass = "bg-[var(--accent)] text-[#1f0b2a]";
      const baseButtonClass =
        "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0";

      return (
        <div
          className={`flex items-center gap-1 rounded-full border px-2 py-1 text-xs shadow-lg backdrop-blur ${containerClasses}`}
        >
          <button
            type="button"
            aria-pressed={reaction.liked}
            onClick={() => toggleLike(post.slug)}
            className={`${baseButtonClass} ${hoverClass} ${reaction.liked ? activeClass : ""}`}
          >
            <ThumbsUp aria-hidden className="h-4 w-4" strokeWidth={2} />
            <span className="sr-only">
              {reaction.liked ? `Remove like from ${post.title}` : `Like ${post.title}`}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={reaction.disliked}
            onClick={() => toggleDislike(post.slug)}
            className={`${baseButtonClass} ${hoverClass} ${reaction.disliked ? activeClass : ""}`}
          >
            <ThumbsDown aria-hidden className="h-4 w-4" strokeWidth={2} />
            <span className="sr-only">
              {reaction.disliked ? `Remove dislike from ${post.title}` : `Dislike ${post.title}`}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={reaction.bookmarked}
            onClick={() => toggleBookmark(post.slug)}
            className={`${baseButtonClass} ${hoverClass} ${reaction.bookmarked ? activeClass : ""}`}
          >
            <Bookmark aria-hidden className="h-4 w-4" strokeWidth={2} />
            <span className="sr-only">
              {reaction.bookmarked ? `Remove bookmark from ${post.title}` : `Bookmark ${post.title}`}
            </span>
          </button>
        </div>
      );
    },
    [reactions, theme, toggleBookmark, toggleDislike, toggleLike],
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${themeStyles.page}`}
      style={accentVariables}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-20 px-6 pb-20 pt-12 sm:px-8 sm:pt-16">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link className="barcode-logo text-4xl uppercase" style={{ color: accentColor }} href="/home">
            D. kline
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div
              ref={searchContainerRef}
              className="relative flex w-full min-w-[14rem] items-center gap-2 sm:w-80 sm:justify-end"
              onBlur={(event) => {
                if (
                  searchContainerRef.current &&
                  event.relatedTarget instanceof Node &&
                  searchContainerRef.current.contains(event.relatedTarget)
                ) {
                  return;
                }

                setIsCategoryMenuOpen(false);
              }}
            >
              <label className="sr-only" htmlFor="site-search">
                Search posts
              </label>
              <input
                id="site-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onFocus={() => setIsCategoryMenuOpen(true)}
                onKeyDown={() => setIsCategoryMenuOpen(true)}
                placeholder="Search notes"
                className={`h-10 w-full rounded-none border-x-0 border-t-0 border-b-[0.5px] px-3 text-sm tracking-wide transition-colors duration-200 hover:border-[#d4afe3] focus:border-[#d4afe3] ${themeStyles.input}`}
              />
              {isCategoryMenuOpen && categories.length > 1 && (
                <div
                  role="listbox"
                  aria-label="Filter posts by category"
                  className={`absolute left-0 top-full z-20 mt-2 w-full rounded-sm border p-2 shadow-lg backdrop-blur ${themeStyles.surface}`}
                >
                  <p className={`mb-2 text-xs uppercase tracking-[0.35em] ${themeStyles.subtleText}`}>
                    Browse categories
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategory === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            setSelectedCategory(category);
                            setIsCategoryMenuOpen(false);
                          }}
                          className={`rounded-sm border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.3em] transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 ${
                            isSelected
                              ? theme === "night"
                                ? "border-[var(--accent)] text-zinc-100"
                                : "border-[var(--accent)] text-zinc-800"
                              : theme === "night"
                                ? "border-transparent text-zinc-300 hover:border-[var(--accent)] hover:text-zinc-100"
                                : "border-transparent text-zinc-600 hover:border-[var(--accent)] hover:text-zinc-900"
                          } cursor-pointer`}
                          onFocus={() => setIsCategoryMenuOpen(true)}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </nav>

        <header className="space-y-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.5em] opacity-80" style={{ color: accentColor }}>
                Journal
              </span>
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
                Writing about craft, curiosity, and the slow web.
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setTheme((mode) => (mode === "night" ? "day" : "night"))}
              aria-label="Toggle day and night theme"
              className={`flex h-10 w-10 items-center justify-center rounded-sm border text-base transition-colors duration-300 cursor-pointer ${
                theme === "night"
                  ? "border-white/20 text-zinc-200 hover:border-[#d4afe3] hover:bg-[rgba(212,175,227,0.18)] hover:text-[#d4afe3]"
                  : "border-zinc-300 text-zinc-600 hover:border-[#d4afe3] hover:bg-[rgba(212,175,227,0.2)] hover:text-[#d4afe3]"
              }`}
            >
              {theme === "night" ? (
                <Moon aria-hidden className="h-4 w-4" strokeWidth={2} />
              ) : (
                <Sun aria-hidden className="h-4 w-4" strokeWidth={2} />
              )}
            </button>
          </div>
          <p className={`max-w-2xl text-base sm:text-lg ${themeStyles.bodyText}`}>
            I'm documenting the experiments that make my creative work feel more intentional—design systems that
            breathe, the stacks that keep me curious, and the habits that tether ideas to everyday life.
          </p>
        </header>

        {featuredPost ? (
          <section className="space-y-4">
            <p className="text-xs uppercase tracking-[0.35em] opacity-80" style={{ color: accentColor }}>
              Featured
            </p>
            <PostCard
              post={featuredPost}
              theme={theme}
              themeStyles={themeStyles}
              variant="featured"
              actions={buildActions(featuredPost)}
            />
          </section>
        ) : (
          <section className="rounded-md border border-dashed border-[var(--accent)]/40 p-6 text-sm text-zinc-500">
            No published stories yet. Publish a draft to share it here.
          </section>
        )}

        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.45em]" style={{ color: accentColor }}>
              Recent posts
            </h2>
            <Link
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: accentColor }}
              href="#archive"
            >
              View archive →
            </Link>
          </div>
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.slug}
                post={post}
                theme={theme}
                themeStyles={themeStyles}
                actions={buildActions(post)}
              />
            ))}
            {filteredPosts.length === 0 && (
              <p className={`text-sm ${themeStyles.subtleText}`}>
                {recentPosts.length === 0 && !hasActiveFilters
                  ? "No additional posts yet. Publish more notes to see them here."
                  : "No posts found. Try adjusting your search or selecting a different filter."}
              </p>
            )}
          </div>
        </section>

        <footer className={`rounded-md border p-8 text-sm transition-colors duration-300 ${themeStyles.surface}`}>
          <p className={themeStyles.bodyText}>
            Want notes in your inbox? Join the monthly dispatch and get the behind-the-scenes experiments before they
            ship.
          </p>
          <form className="mt-6 flex flex-col gap-3 sm:flex-row">
            <input
              className={`h-11 flex-1 rounded-sm px-4 text-sm transition-colors duration-200 ${themeStyles.input}`}
              type="email"
              name="email"
              placeholder="you@example.com"
              aria-label="Email address"
            />
            <button
              className="h-11 rounded-sm bg-[var(--accent)] px-6 text-sm font-semibold text-[#1f0b2a] transition-colors duration-300 hover:bg-[var(--accent-hover)] cursor-pointer"
              type="submit"
            >
              Subscribe
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
