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
};

const BookmarkIcon = ({
  filled = false,
  className = "",
}: {
  filled?: boolean;
  className?: string;
}) => (
  <svg
    aria-hidden
    className={className}
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path
      d="M6 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17l-6-3.5L6 20Z"
      fill={filled ? "currentColor" : "none"}
    />
  </svg>
);

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
};

export function PostCard({
  post,
  theme,
  themeStyles,
  variant = "default",
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

  const containerPadding = variant === "featured" ? "p-8" : "p-6";
  const readingTime = post.readingTime ?? post.reading_time ?? null;
  const headingSize =
    variant === "featured"
      ? "text-3xl font-semibold sm:text-4xl"
      : "text-2xl font-semibold";
  const excerptColor =
    variant === "featured" ? themeStyles.surfaceText : themeStyles.bodyText;

  return (
    <article
      className={`group rounded-md border transition-colors duration-300 ${
        variant === "featured" ? themeStyles.surface : themeStyles.border
      } ${containerPadding} hover:border-[var(--accent)]`}
    >
      {(post.category || readingTime) && (
        <div
          className={`flex flex-wrap items-center gap-3 text-xs ${themeStyles.subtleText}`}
        >
          {post.category && (
            <span className="uppercase tracking-[0.3em]">{post.category}</span>
          )}
          {readingTime && <span>{readingTime}</span>}
        </div>
      )}

      <div
        className={`${
          variant === "featured" ? "mt-6 space-y-3" : "mt-4 space-y-2"
        }`}
      >
        <TitleTag
          className={`${headingSize} transition-colors duration-300 ${
            theme === "night" && variant === "featured"
              ? "text-white"
              : variant === "featured"
              ? "text-zinc-900"
              : ""
          } `}
        >
          <a

            href={`/posts/${post.slug}`}
            className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
          >
            {post.title}
          </a>
        </TitleTag>
        {excerpt && <p className={`text-base sm:text-lg ${excerptColor}`}>{excerpt}</p>}
      </div>

      {post.tags?.length ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className={`rounded-sm border border-transparent px-3 py-1 text-[0.65rem] font-medium uppercase tracking-[0.3em] transition-colors duration-200 ${
                theme === "night"
                  ? "text-zinc-200 hover:border-[var(--accent)]"
                  : "text-zinc-600 hover:border-[var(--accent)]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div
        className={`mt-6 flex items-center justify-between text-xs ${themeStyles.subtleText}`}
      >

        {dateLabel && isoDate && <time dateTime={isoDate}>{dateLabel}</time>}
        <button
          type="button"
          aria-label={`Save ${post.title}`}
          className={`flex h-9 w-9 items-center justify-center rounded-sm text-md transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 ${
            theme === "night"
              ? `text-zinc-300 hover:border-[var(--accent)] hover:text-yellow-300`
              : `text-zinc-600 hover:border-[var(--accent)] hover:text-yellow-300`
          }`}
        >
          <BookmarkIcon />
        </button>
      </div>
    </article>
  );
}
