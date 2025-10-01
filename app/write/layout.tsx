
import { redirect } from "next/navigation";

import DraftsSidebar from "@/components/editor/DraftsSidebar";
import EditorShell from "@/components/editor/EditorShell";
import { createClient } from "@/lib/supabase/server";

export default async function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/");
  }

  const { data: owner, error: ownerError } = await supabase
    .from("blog_owner")
    .select("owner_id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (ownerError || !owner) {
    redirect("/");
  }

  return <EditorShell sidebar={<DraftsSidebar />}>{children}</EditorShell>;
}

