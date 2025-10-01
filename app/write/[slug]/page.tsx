"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { JSONContent } from "@tiptap/core";

import Editor from "@/components/editor/Editor";
import SaveIndicator from "@/components/editor/SaveIndicator";
import { useEditorTheme } from "@/components/editor/EditorShell";
import { createClient } from "@/lib/supabase/client";

type SaveState = "idle" | "saving" | "saved" | "error";

type PostStatus = "draft" | "published";

type DraftRecord = {
  readonly id: string;
  readonly title: string | null;
  readonly content_json: JSONContent | null;
  readonly status: PostStatus;
  readonly published_at: string | null;
};

const statusLabels: Record<PostStatus, string> = {
  draft: "Draft",
  published: "Published",
};

const notifyDrafts = (event: string, detail?: unknown) => {
  window.dispatchEvent(
    detail instanceof Object
      ? new CustomEvent(event, { detail })
      : new Event(event),
  );
};

export default function WriteSlugPage() {
  const supabase = useMemo(() => createClient(), []);
  const params = useParams();
  const router = useRouter();
  const { accentColor } = useEditorTheme();
  const slug = String(params.slug);

  const [postId, setPostId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<JSONContent | null>(null);
  const [saving, setSaving] = useState<SaveState>("idle");
  const [status, setStatus] = useState<PostStatus>("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        alert("Sign in first");
        router.replace("/");
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("id,title,content_json,status,published_at")
        .eq("slug", slug)
        .maybeSingle<DraftRecord>();

      if (error) {
        alert(error.message);
        return;
      }

      if (!data) {
        alert("Draft not found");
        router.replace("/write");
        return;
      }

      if (!active) return;
      setPostId(data.id);
      setTitle(data.title || "Untitled");
      setContent((data.content_json as JSONContent | null) ?? null);
      setStatus(data.status);
      setPublishedAt(data.published_at);
    })();

    return () => {
      active = false;
    };
  }, [router, slug, supabase]);

  useEffect(() => {
    if (!postId) return;
    if (content == null) return;

    setSaving("saving");
    const timeout = setTimeout(async () => {
      const { error } = await supabase
        .from("posts")
        .update({ title, content_json: content })
        .eq("id", postId);

      if (error) {
        setSaving("error");
        return;
      }

      setSaving("saved");
      notifyDrafts("editor:draft-updated", { id: postId, title, slug });
      setTimeout(() => setSaving("idle"), 1200);
    }, 1200);

    return () => clearTimeout(timeout);
  }, [content, postId, slug, supabase, title]);

  useEffect(() => {
    const onKey = async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        await saveVersion();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [content, postId, title]);

  const saveVersion = async () => {
    if (!postId) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const { error } = await supabase.from("post_versions").insert({
      post_id: postId,
      actor_id: auth.user.id,
      title,
      content_json: content,
    });

    if (error) {
      alert(`Save version failed: ${error.message}`);
      return;
    }

    setFeedback("Snapshot saved");
    setTimeout(() => setFeedback(null), 2500);
  };

  const publish = async () => {
    if (!postId) return;
    setIsPublishing(true);
    const { error } = await supabase
      .from("posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", postId);

    setIsPublishing(false);
    if (error) {
      alert(error.message);
      return;
    }

    setStatus("published");
    const now = new Date().toISOString();
    setPublishedAt(now);
    notifyDrafts("editor:refresh-drafts");
    setFeedback("Published! Live on the home feed.");
    setTimeout(() => setFeedback(null), 3200);
  };

  const unpublish = async () => {
    if (!postId) return;
    setIsPublishing(true);
    const { error } = await supabase
      .from("posts")
      .update({ status: "draft", published_at: null })
      .eq("id", postId);

    setIsPublishing(false);
    if (error) {
      alert(error.message);
      return;
    }

    setStatus("draft");
    setPublishedAt(null);
    notifyDrafts("editor:refresh-drafts");
    setFeedback("Unpublished. The draft is private again.");
    setTimeout(() => setFeedback(null), 3200);
  };

  const statusText = statusLabels[status];
  const publishedLabel =
    publishedAt && status === "published"
      ? new Date(publishedAt).toLocaleString()
      : null;

  return (
    <div className="space-y-6">
      <div className="space-y-5 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] px-5 py-6 shadow-[var(--editor-shadow)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 space-y-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Post title"
              className="w-full border-0 bg-transparent text-3xl font-semibold tracking-tight text-[color:var(--editor-page-text)] outline-none placeholder:text-[color:var(--editor-muted)] focus:outline-none"
            />
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-[color:var(--editor-muted)]">
              <span className="rounded-full border border-[var(--editor-border)] px-3 py-1" style={status === "published" ? { borderColor: accentColor, color: accentColor } : undefined}>
                {statusText}
              </span>
              {publishedLabel && <span>Live since {publishedLabel}</span>}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
            <SaveIndicator state={saving} />
            <button
              type="button"
              onClick={saveVersion}
              className="rounded-md border border-[var(--editor-border)] px-3 py-2 uppercase tracking-[0.28em] text-[color:var(--editor-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              Save snapshot
            </button>
            <button
              type="button"
              onClick={publish}
              disabled={isPublishing}
              className="rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#1f0b2a] transition-transform disabled:opacity-60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              Publish
            </button>
            {status === "published" && (
              <button
                type="button"
                onClick={unpublish}
                disabled={isPublishing}
                className="rounded-md border border-[var(--editor-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                Unpublish
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[color:var(--editor-muted)]">
          <span>Slug: {slug}</span>
          {status === "published" && (
            <a
              href={`/posts/${slug}`}
              className="uppercase tracking-[0.28em] text-[color:var(--accent)] transition-colors hover:text-[var(--accent)]/80"
            >
              View live →
            </a>
          )}
        </div>
        {feedback && (
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[color:var(--editor-muted)]">
            {feedback}
          </p>
        )}
      </div>
      <Editor initial={content} onChange={setContent} />
    </div>
  );
}
