"use client";

import { useMemo, useRef, useState } from "react";

const featuredPost = {
  title: "Building a mindful writing practice",
  date: "June 2, 2024",
  excerpt:
    "How small, consistent rituals can turn writing from a task into a grounding daily habit.",
  tags: ["Mindset", "Process"],
};

const posts = [
  {
    title: "Designing a personal knowledge garden",
    date: "May 28, 2024",
    excerpt:
      "Notes on the tools and structures I'm using to grow a digital space that actually helps ideas mature.",
    readingTime: "6 min read",
    category: "Design Systems",
  },
  {
    title: "Setting up frictionless blogging with Next.js",
    date: "May 15, 2024",
    excerpt:
      "From content modelling to deployment pipelines, here are the tweaks that made publishing fast again.",
    readingTime: "8 min read",
    category: "Engineering",
  },
  {
    title: "What I'm learning from a month of analog sketching",
    date: "May 2, 2024",
    excerpt:
      "Mixing ink, paper, and digital post-processing taught me more about observation than any plugin ever has.",
    readingTime: "5 min read",
    category: "Practice",
  },
];

const accentColor = "#d4afe3";

export default function Home() {
  const [theme, setTheme] = useState<"day" | "night">("night");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const categories = useMemo(() => ["All", ...new Set(posts.map((post) => post.category))], []);

  const themeStyles = useMemo(
    () =>
      theme === "night"
        ? {
            page: "bg-[#0b0b0f] text-zinc-100",
            subtleText: "text-zinc-400",
            bodyText: "text-zinc-300",
            surface: "border-white/15 bg-white/5",
            border: "border-white/10",
            input:
              "border-white/20 bg-black/30 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 focus:outline-none",
            surfaceText: "text-zinc-200",
          }
        : {
            page: "bg-[#fdfbff] text-zinc-900",
            subtleText: "text-zinc-500",
            bodyText: "text-zinc-600",
            surface: "border-zinc-200 bg-white/90",
            border: "border-zinc-200",
            input:
              "border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 focus:outline-none",
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
    <div className={`min-h-screen transition-colors duration-500 ${themeStyles.page}`}>
      <div className="mx-auto flex max-w-4xl flex-col gap-20 px-6 pb-20 pt-12 sm:px-8 sm:pt-16">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="barcode-logo text-2xl uppercase" style={{ color: accentColor }}>
            D. kline
          </span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
            <div
              ref={searchContainerRef}
              className="relative flex w-full min-w-[12rem] items-center gap-2 sm:w-64 sm:justify-end"
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
                className={`h-10 w-full rounded-sm border px-3 text-sm tracking-wide transition-colors duration-200 ${themeStyles.input}`}
              />
              {isCategoryMenuOpen && (
                <div
                  role="listbox"
                  aria-label="Filter posts by category"
                  className={`absolute left-0 top-full z-20 mt-2 w-full rounded-sm border p-2 shadow-lg backdrop-blur ${themeStyles.surface}`}
                >
                  <p className={`mb-2 text-xs uppercase tracking-[0.35em] ${themeStyles.subtleText}`}>Browse categories</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        type="button"
                        role="option"
                        aria-selected={selectedCategory === category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setIsCategoryMenuOpen(false);
                        }}
                        className="rounded-full border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.3em] transition-colors duration-200"
                        style={
                          selectedCategory === category
                            ? {
                                borderColor: accentColor,
                                backgroundColor: `${accentColor}1a`,
                                color: accentColor,
                              }
                            : {
                                borderColor: `${accentColor}40`,
                                color: theme === "night" ? "#d0c6d6" : "#6b4f7b",
                              }
                        }
                        onFocus={() => setIsCategoryMenuOpen(true)}
                      >
                        {category}
                      </button>
                    ))}
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
              className={`flex h-10 w-10 items-center justify-center rounded-sm border text-base transition-colors duration-300 ${
                theme === "night"
                  ? "border-white/20 text-zinc-200 hover:border-[rgba(212,175,227,0.6)] hover:text-[#d4afe3]"
                  : "border-zinc-300 text-zinc-600 hover:border-[#d4afe3] hover:text-[#d4afe3]"
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

        <section className={`space-y-8 rounded-md border p-8 transition-colors duration-300 ${themeStyles.surface}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.35em] opacity-80" style={{ color: accentColor }}>
                Featured
              </p>
              <h2 className={`text-2xl font-semibold sm:text-3xl ${theme === "night" ? "text-white" : "text-zinc-900"}`}>
                {featuredPost.title}
              </h2>
            </div>
            <time className={`text-sm ${themeStyles.subtleText}`} dateTime="2024-06-02">
              {featuredPost.date}
            </time>
          </div>
          <p className={`text-base sm:text-lg ${themeStyles.surfaceText}`}>{featuredPost.excerpt}</p>
          <div className="flex flex-wrap gap-2">
            {featuredPost.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.3em]"
                style={{
                  borderColor: `${accentColor}40`,
                  color: accentColor,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="inline-flex w-max items-center gap-2 rounded-sm px-4 py-2 text-sm font-medium transition-colors duration-300"
            style={{
              backgroundColor: accentColor,
              color: theme === "night" ? "#120a17" : "#1f0b2a",
            }}
          >
            Continue reading
            <span aria-hidden className="text-lg">
              →
            </span>
          </button>
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
          <div className="space-y-10">
            {filteredPosts.map((post) => (
              <article key={post.title} className={`space-y-4 border-b pb-8 last:border-b-0 last:pb-0 ${themeStyles.border}`}>
                <div className={`flex flex-wrap items-center justify-between gap-2 text-xs ${themeStyles.subtleText}`}>
                  <time dateTime={post.date}>{post.date}</time>
                  <div className="flex items-center gap-3">
                    <span className="uppercase tracking-[0.3em]">{post.category}</span>
                    <span>{post.readingTime}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold transition-colors duration-200" style={{ color: accentColor }}>
                    <a href="#">{post.title}</a>
                  </h3>
                  <p className={`text-base sm:text-lg ${themeStyles.bodyText}`}>{post.excerpt}</p>
                </div>
                <a
                  className="inline-flex items-center gap-2 text-sm font-medium transition-colors duration-200"
                  style={{ color: accentColor }}
                  href="#"
                >
                  Read story <span aria-hidden className="text-lg">→</span>
                </a>
              </article>
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
              className="h-11 rounded-sm px-6 text-sm font-semibold transition-colors duration-300"
              style={{
                backgroundColor: accentColor,
                color: theme === "night" ? "#120a17" : "#1f0b2a",
              }}
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
