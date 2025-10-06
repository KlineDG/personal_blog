import React from "react";

// Minimal, drop-in thumbnail component matching your style guide.
// - Editorial minimalism, soft borders, accent #d4afe3 on interactive states
// - Monospace rhythm, tight uppercase labels
// - Image with fixed ratio, graceful fallback, accessible alt
// - 1–2 line clamps for title & excerpt (using CSS, no plugin required)

// ---- Types ----
export type PostThumb = {
  slug: string;
  title: string;
  cover_image_url?: string | null;
  cover_image_alt?: string | null;
  excerpt?: string | null;
  tags?: string[];
  published_at: string; // ISO string
  updated_at?: string | null;
  reading_time_minutes?: number | null; // optional badge
  is_external?: boolean; // if true, open canonical_url
  canonical_url?: string | null;
};

// ---- Helpers ----
const ACCENT = "#d4afe3" as const;

function fmtDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}

// ---- Component ----
export function PostThumbnail({
  post,
  className,
}: {
  post: PostThumb;
  className?: string;
}) {
  const {
    slug,
    title,
    cover_image_url,
    cover_image_alt,
    excerpt,
    tags = [],
    published_at,
    updated_at,
    reading_time_minutes,
    is_external,
    canonical_url,
  } = post;

  const href = is_external && canonical_url ? canonical_url : `/posts/${slug}`;
  const showUpdated = updated_at && updated_at !== published_at;

  return (
    <a
      href={href}
      target={is_external ? "_blank" : undefined}
      rel={is_external ? "noopener noreferrer" : undefined}
      className={classNames(
        "group block overflow-hidden rounded-md border transition-shadow",
        // Surfaces: day/night (tailwind dark variant)
        "border-zinc-200 bg-white/90 dark:border-white/15 dark:bg-white/5",
        // Focus ring with accent
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[" + ACCENT + "]",
        className
      )}
      style={{
        // small, soft shadow per style guide
        boxShadow: "0 1px 0 rgba(0,0,0,0.03), 0 12px 30px rgba(0,0,0,0.04)",
      }}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover_image_url}
            alt={cover_image_alt ?? ""}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          // Fallback surface with barcode-ish accent stripes
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,_rgba(212,175,227,0.25),_transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,_rgba(212,175,227,0.15),_transparent_60%)]">
            <svg viewBox="0 0 100 56" className="h-full w-full text-zinc-300/30 dark:text-zinc-100/10">
              <g fill="currentColor">
                {Array.from({ length: 20 }).map((_, i) => (
                  <rect key={i} x={i * 5} y={0} width={(i % 3) + 1} height={56} />
                ))}
              </g>
            </svg>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-600 dark:text-zinc-400">
          <span className="rounded-full border px-2 py-0.5 border-zinc-300/70 dark:border-white/15">
            {fmtDate(published_at)}
          </span>
          {showUpdated && (
            <span className="text-zinc-500 dark:text-zinc-400">· Updated</span>
          )}
          {typeof reading_time_minutes === "number" && reading_time_minutes > 0 && (
            <span className="text-zinc-500 dark:text-zinc-400">· {reading_time_minutes} min</span>
          )}
          {is_external && <span className="text-zinc-500 dark:text-zinc-400">· External ↗</span>}
        </div>

        {/* Title */}
        <h3
          className={`font-mono text-lg font-semibold leading-snug text-zinc-900 dark:text-zinc-100 transition-colors group-hover:text-[${ACCENT}]`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as any,
            overflow: "hidden",
          }}
        >
          {title}
        </h3>

        {/* Excerpt */}
        {excerpt && (
          <p
            className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any,
              overflow: "hidden",
            }}
          >
            {excerpt}
          </p>
        )}

        {/* Tags */}
        {!!tags?.length && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className={`select-none rounded border px-2 py-0.5 text-[11px] uppercase tracking-[0.28em] text-zinc-600 border-zinc-300/70 transition-colors hover:border-[${ACCENT}] hover:text-[${ACCENT}] dark:text-zinc-400 dark:border-white/15`}
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </a>
  );
}

// ---- Preview Grid ----
const DEMO_POSTS: PostThumb[] = [
  {
    slug: "barcode-minimalism",
    title: "Barcode Minimalism: Designing Signals with Restraint",
    cover_image_url:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
    cover_image_alt: "Abstract lavender light and shadow",
    excerpt:
      "Notes on a quiet interface: tight grids, uppercase labels, and a single accent for intent.",
    tags: ["design", "opinion", "ui"],
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
    updated_at: null,
    reading_time_minutes: 6,
  },
  {
    slug: "tiptap-figure-captions",
    title: "TipTap Figures: Alignment, Captions, and Text Wrap",
    cover_image_url:
      "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=1200&auto=format&fit=crop",
    cover_image_alt: "Developer desk with code on screen",
    excerpt:
      "A tiny custom node that turns images into figures with left/right float and clean captions.",
    tags: ["tiptap", "supabase"],
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    reading_time_minutes: 4,
  },
  {
    slug: "weeknotes-36",
    title: "Weeknotes 36: Shipping the Editor",
    // No image → fallback barcode stripes
    cover_image_url: undefined,
    excerpt: "What landed this week: autosave, folders, and public image policies.",
    tags: ["notes"],
    published_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28).toISOString(),
    updated_at: null,
    reading_time_minutes: 3,
  },
];

export default function ThumbnailPreviewPage() {
  return (
    <div className="min-h-screen bg-[#fdfbff] text-zinc-900 dark:bg-[#0b0b0f] dark:text-zinc-100 p-6 md:p-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-end justify-between">
          <h1 className="font-mono text-xl tracking-tight">Thumbnails — Preview</h1>
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Accent: <span style={{ color: ACCENT }}>{ACCENT}</span>
          </div>
        </header>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_POSTS.map((post) => (
            <PostThumbnail key={post.slug} post={post} />
          ))}
        </div>
        <p className="mt-10 text-xs text-zinc-600 dark:text-zinc-400">
          Tip: toggle your system dark mode to preview both themes. Cards adapt via Tailwind's <code>dark:</code> classes.
        </p>
      </div>
    </div>
  );
}
