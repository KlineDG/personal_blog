"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { useParams, useRouter } from "next/navigation";

import Editor from "@/components/editor/Editor";
import SaveIndicator from "@/components/editor/SaveIndicator";
import { useEditorTheme } from "@/components/editor/EditorShell";
import { createClient } from "@/lib/supabase/client";

type SaveState = "idle" | "saving" | "saved" | "error";

type DraftStatus = "draft" | "published";

type PostRecord = {
  readonly id: string;
  readonly title: string | null;
  readonly content_json: JSONContent | null;
  readonly status: DraftStatus;
};

export default function WriteSlugPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const { tokens } = useEditorTheme();

  const slug = String(params.slug);
  const [postId, setPostId] = useState<string>("");
  const [title, setTitle] = useState("Untitled");
  const [content, setContent] = useState<JSONContent | null>(null);
  const [saving, setSaving] = useState<SaveState>("idle");
  const [status, setStatus] = useState<DraftStatus>("draft");

  useEffect(() => {
    void (async () => {
      const user = (await supabase.auth.getUser()).data.user;

      if (!user) {
        alert("Sign in first");
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("id,title,content_json,status")
        .eq("slug", slug)
        .maybeSingle<PostRecord>();

      if (error) {
        alert(error.message);
        return;
      }

      if (!data) {
        alert("Draft not found");
        router.replace("/write");
        return;
      }

      setPostId(data.id);
      setTitle(data.title && data.title.length > 0 ? data.title : "Untitled");
      setContent(data.content_json);
      setStatus(data.status);
    })();
  }, [router, slug, supabase]);

  useEffect(() => {
    if (!postId) {
      return;
    }

    setSaving("saving");
    const timeout = window.setTimeout(async () => {
      const { error } = await supabase
        .from("posts")
        .update({ title, content_json: content })
        .eq("id", postId);

      setSaving(error ? "error" : "saved");

      if (!error) {
        window.setTimeout(() => setSaving("idle"), 1000);
      }
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [content, postId, supabase, title]);

  const saveVersion = useCallback(async () => {
    if (!postId) {
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;

    if (!user) {
      return;
    }

    const { error } = await supabase.from("post_versions").insert({
      post_id: postId,
      actor_id: user.id,
      title,
      content_json: content,
    });

    if (error) {
      alert(`Save version failed: ${error.message}`);
      return;
    }

    alert("Version saved");
  }, [content, postId, supabase, title]);

  useEffect(() => {
    const onKey = async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        await saveVersion();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveVersion]);

  const publish = useCallback(async () => {
    if (!postId) {
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", postId);

    if (error) {
      alert(error.message);
      return;
    }

    setStatus("published");
    alert("Published");
  }, [postId, supabase]);

  const unpublish = useCallback(async () => {
    if (!postId) {
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({ status: "draft", published_at: null })
      .eq("id", postId);

    if (error) {
      alert(error.message);
      return;
    }

    setStatus("draft");
    alert("Unpublished");
  }, [postId, supabase]);

  return (
    <div className="flex flex-col gap-6">
      <section className={`rounded-md px-6 py-5 shadow-sm transition-colors duration-300 ${tokens.surface}`}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-[12rem] flex-1 flex-col gap-2">
            <label className="text-xs font-medium uppercase tracking-[0.35em]">
              <span className={tokens.subtle}>Title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Post title"
                className={`mt-2 w-full border-b border-transparent bg-transparent text-3xl font-semibold tracking-tight outline-none transition-colors duration-300 focus:border-[var(--accent)] focus:outline-none`}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SaveIndicator state={saving} />
            <button
              type="button"
              onClick={saveVersion}
              className={`rounded-sm border px-3 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-colors duration-200 ${tokens.buttonSecondary}`}
            >
              Save version
            </button>
            <button
              type="button"
              onClick={status === "published" ? unpublish : publish}
              className={`rounded-sm px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] transition-colors duration-200 ${
                status === "published" ? tokens.buttonSecondary : tokens.buttonPrimary
              }`}
            >
              {status === "published" ? "Unpublish" : "Publish"}
            </button>
          </div>
        </div>
      </section>

      <section className={`rounded-md border px-5 py-6 shadow-sm transition-colors duration-300 ${tokens.surface}`}>
        <Editor initial={content} onChange={setContent} />
      </section>
    </div>
  );
}
