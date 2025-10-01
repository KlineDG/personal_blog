import { HomePageClient } from "@/components/home/HomePageClient";
import type { PostCardPost, PostListRow } from "@/lib/posts";
import { mapRowToPostCard } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

async function getPublishedPosts() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id,title,slug,excerpt,published_at,reading_time,category,tags")
    .eq("status", "published")
    .is("is_deleted", false)
    .order("published_at", { ascending: false });

  const posts = ((data ?? []) as PostListRow[]).map((row) => mapRowToPostCard(row));
  const [featuredPost, ...recentPosts] = posts;

  return {
    featuredPost: featuredPost ?? null,
    recentPosts,
    error: error?.message,
  } satisfies {
    featuredPost: PostCardPost | null;
    recentPosts: PostCardPost[];
    error?: string;
  };
}

export default async function HomePage() {
  const { featuredPost, recentPosts, error } = await getPublishedPosts();

  return <HomePageClient featuredPost={featuredPost} posts={recentPosts} error={error} />;
}
