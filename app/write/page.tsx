"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export default function WriteIndex() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const title = "Untitled";
      const slug = `untitled-${Math.random().toString(36).slice(2, 8)}`;
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) {
        alert("Sign in first");
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: user.id,
          title,
          slug,
          status: "draft",
          content_json: { type: "doc", content: [{ type: "paragraph" }] },
        })
        .select("slug")
        .single();

      if (error) {
        alert(error.message);
        return;
      }

      router.replace(`/write/${data.slug}`);
    })();
  }, [router, supabase]);

  return (
    <div className="rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] px-6 py-10 text-sm text-[color:var(--editor-muted)] shadow-[var(--editor-shadow)]">
      Creating draft…
    </div>
  );
}
