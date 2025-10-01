import HomeClient from "./HomeClient";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
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

