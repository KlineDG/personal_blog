import Link from "next/link";
import type { ReactNode } from "react";

export type PostCardPost = {
  readonly title: string;
  readonly slug: string;
  readonly excerpt?: string | null;
  readonly category?: string | null;
  readonly tags?: readonly string[] | null;
  readonly readingTime?: string | null;
  readonly reading_time?: string | null;
  readonly publishedAt?: string | null;
  readonly isoDate?: string | null;
  readonly dateLabel?: string | null;
  readonly thumbnail?: {
    readonly src: string;
    readonly alt?: string;
  } | null;
};

export type PostCardTheme = {
  subtleText: string;
  bodyText: string;
  surfaceText: string;
  border: string;
  surface: string;
};

type PostCardProps = {
  post: PostCardPost;
  theme: "day" | "night";
  themeStyles: PostCardTheme;
  variant?: "default" | "featured";
  actions?: ReactNode;
};

export function PostCard({
  post,
  theme,
  themeStyles,
  variant = "default",
  actions,
}: PostCardProps) {
  const TitleTag = (variant === "featured" ? "h2" : "h3") as const;
  const isoDate = post.isoDate ?? (post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined);
  const dateLabel =
    post.dateLabel ??
    (post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : undefined);
  const excerpt = post.excerpt ?? "";
  const headingSize =
    variant === "featured"
      ? "text-3xl font-medium sm:text-4xl"
      : "text-2xl font-medium";
  const excerptColor =
    variant === "featured" ? themeStyles.surfaceText : themeStyles.bodyText;
  const cardBackground = theme === "night" ? "bg-zinc-900/80" : "bg-white";
  const titleColor =
    theme === "night" && variant === "featured"
      ? "text-white"
      : theme === "night"
        ? "text-zinc-100"
        : "text-zinc-900";
  const tags = Array.isArray(post.tags) ? post.tags.slice(0, 3) : [];
  const hoverShadow =
    theme === "night"
      ? "hover:shadow-[0_24px_40px_rgba(12,10,28,0.55)] focus-within:shadow-[0_24px_40px_rgba(12,10,28,0.55)]"
      : "hover:shadow-[0_24px_40px_rgba(23,15,53,0.18)] focus-within:shadow-[0_24px_40px_rgba(23,15,53,0.18)]";

  return (
    <article
      className={`group flex flex-col rounded-none ${cardBackground} transition-all duration-300 hover:-translate-y-1 hover:bg-[var(--accent)]/10 focus-within:bg-[var(--accent)]/10 ${hoverShadow}`}
    >
      <div className="px-4 pb-3 pt-4">
        <div className="relative mx-auto w-full max-w-full overflow-hidden">
          <Link
            href={`/posts/${post.slug}`}
            className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            <div className="aspect-[20/9] w-full overflow-hidden">
              {post.thumbnail?.src ? (
                <img
                  src={post.thumbnail.src}
                  alt={post.thumbnail.alt ?? post.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(212,175,227,0.35),transparent)]"
                >
                  <span className={`text-sm uppercase tracking-[0.35em] ${themeStyles.subtleText}`}>
                    {post.category ?? "Journal"}
                  </span>
                </div>
              )}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "linear-gradient(180deg, rgba(16,12,32,0) 0%, rgba(212,175,227,0.25) 100%)" }}
              />
            </div>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-4 pb-5 pt-3">
        <div className="flex flex-col gap-3">
          <TitleTag className={`${headingSize} ${titleColor} tracking-tight`}>
            <Link
              href={`/posts/${post.slug}`}
              className="rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
            >
              {post.title}
            </Link>
          </TitleTag>
          {excerpt && (
            <p className={`text-sm font-light leading-snug ${excerptColor}`}>
              {excerpt}
            </p>
          )}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.65rem] uppercase tracking-[0.25em] ${
                    theme === "night"
                      ? "border-white/10 bg-white/5 text-zinc-200"
                      : "border-zinc-200 bg-zinc-100 text-zinc-600"
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className={`text-xs font-light uppercase tracking-[0.3em] ${themeStyles.subtleText}`}>
            {dateLabel && isoDate && (
              <time className="lowercase" dateTime={isoDate}>
                {dateLabel}
              </time>
            )}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      </div>
    </article>
  );
}
