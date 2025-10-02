"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock3,
  FilePenLine,
  Link2,
  Rocket,
  Save,
  Sparkles,
  Undo2,
} from "lucide-react";

import Editor from "@/components/editor/Editor";
import SaveIndicator from "@/components/editor/SaveIndicator";
import { useEditorTheme } from "@/components/editor/EditorShell";
import Toolbar from "@/components/editor/Toolbar";
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
  const [editorInstance, setEditorInstance] = useState<TiptapEditor | null>(null);
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

  const pushDraftUpdate = useCallback(async () => {
    if (!postId) return;
    if (content == null) return;

    setSaving("saving");
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
  }, [content, postId, slug, supabase, title]);

  useEffect(() => {
    if (!postId) return;
    if (content == null) return;

    setSaving("saving");
    const timeout = setTimeout(() => {
      void pushDraftUpdate();
    }, 1200);

    return () => clearTimeout(timeout);
  }, [content, postId, pushDraftUpdate]);

  const handleManualSave = useCallback(async () => {
    await pushDraftUpdate();
  }, [pushDraftUpdate]);

  useEffect(() => {
    const onKey = async (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        await handleManualSave();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleManualSave]);

  const saveSnapshot = useCallback(async () => {
    if (!postId) return;
    if (content == null) return;
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
  }, [content, postId, supabase, title]);

  const publish = useCallback(async () => {
    if (!postId) return;
    setIsPublishing(true);
    const { error } = await supabase
      .from("posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", postId);

    if (error) {
      alert(error.message);
      setIsPublishing(false);
      return;
    }

    setStatus("published");
    const now = new Date().toISOString();
    setPublishedAt(now);
    notifyDrafts("editor:refresh-drafts");
    setFeedback("Published! Live on the home feed.");
    setTimeout(() => setFeedback(null), 3200);
    setIsPublishing(false);
  }, [postId, supabase]);

  const unpublish = useCallback(async () => {
    if (!postId) return;
    setIsPublishing(true);
    const { error } = await supabase
      .from("posts")
      .update({ status: "draft", published_at: null })
      .eq("id", postId);

    if (error) {
      alert(error.message);
      setIsPublishing(false);
      return;
    }

    setStatus("draft");
    setPublishedAt(null);
    notifyDrafts("editor:refresh-drafts");
    setFeedback("Unpublished. The draft is private again.");
    setTimeout(() => setFeedback(null), 3200);
    setIsPublishing(false);
  }, [postId, supabase]);

  const isPublished = status === "published";
  const statusText = statusLabels[status];
  const publishedLabel =
    publishedAt && isPublished
      ? new Date(publishedAt).toLocaleString()
      : null;
  const canSaveDraft = Boolean(postId && content);

  return (
    <div className="space-y-8">
      <div
        className="sticky top-0 z-10 space-y-3 rounded-2xl border border-[var(--editor-border)] px-5 py-5 shadow-[var(--editor-shadow)] backdrop-blur"
        style={{ backgroundColor: "var(--editor-nav-bg)" }}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <label htmlFor="post-title" className="sr-only">
              Post title
            </label>
            <input
              id="post-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Post title"
              className="w-full border-0 bg-transparent text-2xl font-semibold tracking-tight text-[color:var(--editor-page-text)] outline-none placeholder:text-[color:var(--editor-muted)] focus:outline-none sm:text-3xl"
            />
          </div>
          <div className="flex flex-col items-start gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)] sm:flex-row sm:items-center sm:gap-4">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1"
              style={
                isPublished
                  ? { borderColor: accentColor, color: accentColor }
                  : undefined
              }
            >
              {isPublished ? (
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <FilePenLine className="h-3.5 w-3.5" aria-hidden />
              )}
              {statusText}
            </span>
            {publishedLabel && (
              <span className="inline-flex items-center gap-2 normal-case tracking-normal">
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
                Live since {publishedLabel}
              </span>
            )}
          </div>
        </div>
      </div>
      <Editor initial={content} onChange={setContent} onReady={setEditorInstance} />
      <div className="space-y-4 rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-surface)] px-5 py-6 shadow-[var(--editor-shadow)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4 text-xs text-[color:var(--editor-muted)]">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--editor-subtle-border)] px-3 py-1">
              <Link2 className="h-3.5 w-3.5" aria-hidden />
              {slug}
            </span>
            {isPublished && (
              <a
                href={`/posts/${slug}`}
                className="inline-flex items-center gap-2 uppercase tracking-[0.28em] text-[color:var(--accent)] transition-colors hover:text-[var(--accent)]/80"
              >
                View live
                <Rocket className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Toolbar editor={editorInstance} accent={accentColor} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SaveIndicator state={saving} />
              <button
                type="button"
                onClick={handleManualSave}
                disabled={!canSaveDraft}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--editor-border)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--editor-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save draft
              </button>
              <button
                type="button"
                onClick={publish}
                disabled={isPublishing || isPublished}
                className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[#1f0b2a] transition-transform disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <Rocket className="h-4 w-4" aria-hidden />
                Publish
              </button>
              {isPublished && (
                <button
                  type="button"
                  onClick={unpublish}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 rounded-md border border-[var(--editor-border)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
                >
                  <Undo2 className="h-4 w-4" aria-hidden />
                  Unpublish
                </button>
              )}
              <button
                type="button"
                onClick={saveSnapshot}
                disabled={!canSaveDraft}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--editor-subtle-border)] px-4 py-2 text-xs uppercase tracking-[0.32em] text-[color:var(--editor-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Snapshot
              </button>
            </div>
          </div>
        </div>
        {feedback && (
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-[color:var(--editor-muted)]">
            {feedback}
          </p>
        )}
      </div>
    </div>
  );
}
