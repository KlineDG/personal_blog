import type { JSONContent } from "@tiptap/core";

export type PostCardPost = {
  id: string;
  slug?: string;
  title: string;
  excerpt: string;
  date: string;
  isoDate: string;
  readingTime?: string;
  category?: string;
  tags?: string[];
};

export type PostListRow = {
  id: string;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  published_at: string | null;
  reading_time: string | number | null;
  category: string | null;
  tags: string[] | null;
};

export type PostDetailRow = PostListRow & {
  content_json: JSONContent | null;
};

export function mapRowToPostCard(row: PostListRow): PostCardPost {
  const publishedAt = row.published_at ? new Date(row.published_at) : null;
  const isoDate = publishedAt ? publishedAt.toISOString().split("T")[0] : "";
  const formattedDate = publishedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(publishedAt)
    : "Publishing soon";

  return {
    id: row.id,
    slug: row.slug ?? undefined,
    title: row.title ?? "Untitled",
    excerpt: row.excerpt ?? "",
    date: formattedDate,
    isoDate,
    readingTime:
      row.reading_time === null || row.reading_time === undefined
        ? undefined
        : typeof row.reading_time === "string"
          ? row.reading_time
          : `${row.reading_time} min read`,
    category: row.category ?? undefined,
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : undefined,
  };
}
