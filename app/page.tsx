"use client";

import { useMemo, useRef, useState, type CSSProperties } from "react";

import { PostCard, type PostCardTheme } from "../components/PostCard";
import { featuredPost, posts } from "../data/posts";

const accentColor = "#d4afe3";
const accentHoverColor = "#e3c4f0";

type ThemeConfig = PostCardTheme & {
  page: string;
  input: string;
};

export default function Home() {
  const [theme, setTheme] = useState<"day" | "night">("night");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

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
          posts
            .map((post) => post.category)
            .filter((category): category is string => Boolean(category)),
        ),
      ),
    ],
    [],
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

    return posts.filter((post) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [post.title, post.excerpt].some((field) => field.toLowerCase().includes(normalizedQuery));
      const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${themeStyles.page}`}
      style={accentVariables}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-20 px-6 pb-20 pt-12 sm:px-8 sm:pt-16">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="barcode-logo text-4xl uppercase" style={{ color: accentColor }}>
            D. kline
          </span>
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
              {isCategoryMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Filter posts by category"
                  className={`absolute left-0 top-full z-20 mt-2 w-full rounded-sm border p-2 shadow-lg backdrop-blur ${themeStyles.surface}`}
                >
                  <p className={`mb-2 text-xs uppercase tracking-[0.35em] ${themeStyles.subtleText}`}>Browse categories</p>
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
              <span aria-hidden>{theme === "night" ? "☾" : "☀"}</span>
            </button>
          </div>
          <p className={`max-w-2xl text-base sm:text-lg ${themeStyles.bodyText}`}>
            I'm documenting the experiments that make my creative work feel more intentional—design systems that
            breathe, the stacks that keep me curious, and the habits that tether ideas to everyday life.
          </p>
        </header>

        <section className="space-y-4">
          <p className="text-xs uppercase tracking-[0.35em] opacity-80" style={{ color: accentColor }}>
            Featured
          </p>
          <PostCard post={featuredPost} theme={theme} themeStyles={themeStyles} variant="featured" />
        </section>

        <section className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.45em]" style={{ color: accentColor }}>
              Recent posts
            </h2>
            <a
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: accentColor }}
              href="#archive"
            >
              View archive →
            </a>
          </div>
          <div className="space-y-6">
            {filteredPosts.map((post) => (
              <PostCard key={post.title} post={post} theme={theme} themeStyles={themeStyles} />
            ))}
            {filteredPosts.length === 0 && (
              <p className={`text-sm ${themeStyles.subtleText}`}>
                No posts found. Try adjusting your search or selecting a different filter.
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
