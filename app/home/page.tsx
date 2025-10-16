
import HomeClient from "./HomeClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id,title,slug,excerpt,content_json,category,tags,reading_time,published_at,updated_at,thumbnail_url,thumbnail_alt",
    )
    .eq("status", "published")
    .eq("is_deleted", false)
    .order("published_at", { ascending: false })
    .order("updated_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to load posts", error.message);
  }

  return <HomeClient posts={data ?? []} />;
}

