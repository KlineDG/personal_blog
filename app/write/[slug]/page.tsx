"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { JSONContent } from "@tiptap/core";
import type { Editor as TiptapEditor } from "@tiptap/react";
import { useParams, useRouter } from "next/navigation";
import { Clock3, Link2, Rocket, Save, Sparkles, Undo2 } from "lucide-react";

import Editor from "@/components/editor/Editor";
import { useEditorTheme } from "@/components/editor/EditorShell";
import Toolbar from "@/components/editor/Toolbar";
import PublishModal, {
  type PublishThumbnail,
} from "@/components/write/PublishModal";
import { createClient } from "@/lib/supabase/client";

type PostStatus = "draft" | "published";

type DraftRecord = {
  readonly id: string;
  readonly title: string | null;
  readonly content_json: JSONContent | null;
  readonly status: PostStatus;
  readonly published_at: string | null;
  readonly excerpt: string | null;
  readonly tags: string[] | null;
  readonly thumbnail_url: string | null;
  readonly thumbnail_alt: string | null;
};

const AVAILABLE_TAGS = [
  "Writing",
  "Process",
  "Craft",
  "Mindset",
  "Productivity",
  "Wellness",
  "Systems",
  "Research",
  "Tooling",
  "Inspiration",
  "Audio",
  "Mood",
] as const;

type PublishMetadata = {
  readonly title: string;
  readonly summary: string;
  readonly tags: string[];
  readonly thumbnailUrl: string;
  readonly thumbnailAlt?: string | null;
  readonly thumbnailSource?: PublishThumbnail["source"];
  readonly thumbnailName?: string | null;
};

const SUMMARY_MAX_LENGTH = 220;

function collectPlainText(node: JSONContent | null | undefined): string {
  if (!node) return "";
  if (typeof node.text === "string") {
    return node.text;
  }
  if (!Array.isArray(node.content)) {
    return "";
  }
  return node.content
    .map((child) => collectPlainText(child as JSONContent))
    .join(" ");
}

function deriveSummary(
  content: JSONContent | null | undefined,
  fallback: string | null | undefined = "",
): string {
  const base = collectPlainText(content).trim();
  const raw = base || fallback || "";
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= SUMMARY_MAX_LENGTH) {
    return normalized;
  }
  return `${normalized.slice(0, SUMMARY_MAX_LENGTH - 1).trimEnd()}…`;
}

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
  const [status, setStatus] = useState<PostStatus>("draft");
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishTitleInput, setPublishTitleInput] = useState("");
  const [publishSummaryInput, setPublishSummaryInput] = useState("");
  const [publishTags, setPublishTags] = useState<string[]>([]);
  const [publishThumbnail, setPublishThumbnail] = useState<PublishThumbnail | null>(null);
  const [publishThumbnailAlt, setPublishThumbnailAlt] = useState("");
  const [publishError, setPublishError] = useState<string | null>(null);

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

        .select(
          "id,title,content_json,status,published_at,excerpt,tags,thumbnail_url,thumbnail_alt",
        )
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
      const normalizedTitle = (data.title ?? "Untitled").trim() || "Untitled";
      setPostId(data.id);
      setTitle(normalizedTitle);
      setPublishTitleInput(normalizedTitle);
      setContent((data.content_json as JSONContent | null) ?? null);
      setStatus(data.status);
      setPublishedAt(data.published_at);
      setPublishSummaryInput(data.excerpt ?? "");
      const initialTags = Array.isArray(data.tags)
        ? data.tags.filter((tag): tag is string => typeof tag === "string")
        : [];
      setPublishTags(initialTags);
      if (data.thumbnail_url) {
        setPublishThumbnail({
          url: data.thumbnail_url,
          source: "remote",
          name: data.thumbnail_alt ?? null,
        });
      } else {
        setPublishThumbnail(null);
      }
      setPublishThumbnailAlt(data.thumbnail_alt ?? "");
    })();

    return () => {
      active = false;
    };
  }, [router, slug, supabase]);

  const pushDraftUpdate = useCallback(async () => {
    if (!postId) return;
    if (content == null) return;

    const { error } = await supabase
      .from("posts")
      .update({ title, content_json: content })
      .eq("id", postId);

    if (error) {
      return;
    }

    notifyDrafts("editor:draft-updated", { id: postId, title, slug });
  }, [content, postId, slug, supabase, title]);

  useEffect(() => {
    if (!postId) return;
    if (content == null) return;

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

  const publish = useCallback(
    async (metadata: PublishMetadata) => {
      if (!postId) return false;
      setIsPublishing(true);
      try {
        const now = new Date().toISOString();
        const updates: Record<string, unknown> = {
          status: "published",
          published_at: now,
          title: metadata.title,
          excerpt: metadata.summary,
          tags: metadata.tags,
          thumbnail_url: metadata.thumbnailUrl,
          thumbnail_alt: metadata.thumbnailAlt ?? null,
        };
        if (content != null) {
          updates.content_json = content;
        }

        const { error } = await supabase
          .from("posts")
          .update(updates)
          .eq("id", postId);

        if (error) {
          alert(error.message);
          return false;
        }

        setStatus("published");
        setPublishedAt(now);
        setTitle(metadata.title);
        setPublishTitleInput(metadata.title);
        setPublishSummaryInput(metadata.summary);
        setPublishTags(metadata.tags);
        setPublishThumbnail({
          url: metadata.thumbnailUrl,
          source: metadata.thumbnailSource ?? "preset",
          name: metadata.thumbnailName ?? null,
        });
        setPublishThumbnailAlt(metadata.thumbnailAlt ?? "");
        notifyDrafts("editor:draft-updated", { id: postId, title: metadata.title, slug });
        notifyDrafts("editor:refresh-drafts");
        setFeedback("Published! Live on the home feed.");
        setTimeout(() => setFeedback(null), 3200);
        return true;
      } finally {
        setIsPublishing(false);
      }
    },
    [content, postId, slug, supabase],
  );

  const handleToggleTag = useCallback((tag: string) => {
    setPublishTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    );
  }, []);

  const handleOpenPublishModal = useCallback(() => {
    setPublishError(null);
    setPublishTitleInput((current) => {
      if (current.trim()) {
        return current;
      }
      const normalized = title.trim() || "Untitled";
      return normalized;
    });
    setPublishSummaryInput((current) => {
      if (current.trim()) {
        return current;
      }
      const generated = deriveSummary(content, title);
      return generated || current;
    });
    setIsPublishModalOpen(true);
  }, [content, title]);

  const handlePublishCancel = useCallback(() => {
    if (isPublishing) {
      return;
    }
    setIsPublishModalOpen(false);
    setPublishError(null);
  }, [isPublishing]);

  const handlePublishConfirm = useCallback(async () => {
    const trimmedTitle = publishTitleInput.trim();
    if (!trimmedTitle) {
      setPublishError("Title is required to publish.");
      return;
    }
    const trimmedSummary = publishSummaryInput.trim();
    if (!trimmedSummary) {
      setPublishError("Add a short summary before publishing.");
      return;
    }
    if (publishTags.length === 0) {
      setPublishError("Choose at least one tag.");
      return;
    }
    if (!publishThumbnail || !publishThumbnail.url) {
      setPublishError("Select a thumbnail image.");
      return;
    }

    const finalAlt = publishThumbnailAlt.trim();
    setPublishTitleInput(trimmedTitle);
    setPublishSummaryInput(trimmedSummary);
    setPublishThumbnailAlt(finalAlt);
    setPublishError(null);

    const success = await publish({
      title: trimmedTitle,
      summary: trimmedSummary,
      tags: publishTags,
      thumbnailUrl: publishThumbnail.url,
      thumbnailAlt: finalAlt || null,
      thumbnailSource: publishThumbnail.source,
      thumbnailName: publishThumbnail.name ?? null,
    });

    if (success) {
      setIsPublishModalOpen(false);
      setPublishError(null);
    } else {
      setPublishError("We couldn't publish this post. Please try again.");
    }
  }, [
    publish,
    publishSummaryInput,
    publishTags,
    publishThumbnail,
    publishThumbnailAlt,
    publishTitleInput,
  ]);

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
  const publishedLabel =
    publishedAt && isPublished
      ? new Date(publishedAt).toLocaleString()
      : null;
  const canSaveDraft = Boolean(postId && content);

  return (
    <div className="space-y-6 pb-32">
      <div className="sticky top-0 z-20 bg-[color:var(--editor-page-bg)]/90 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--editor-page-bg)]/80">
        <div className="mx-auto w-full max-w-4xl space-y-3 px-5 py-5">
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
              <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--editor-muted)]">
                <Link2 className="h-3 w-3" aria-hidden />
                <span className="truncate" title={slug}>
                  {slug}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-start gap-2 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)] sm:flex-row sm:items-center sm:gap-4">
              {publishedLabel && (
                <span className="inline-flex items-center gap-2 normal-case tracking-normal">
                  <Clock3 className="h-3.5 w-3.5" aria-hidden />
                  Live since {publishedLabel}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <Editor
        initial={content}
        onChange={setContent}
        onReady={(instance) => {
          setEditorInstance(instance);
          setCharacterCount(instance?.storage.characterCount.characters() ?? 0);
        }}
        onCharacterCountChange={setCharacterCount}
      />
      {editorInstance && (
        <>
          <div className="pointer-events-none">
            <div className="pointer-events-auto fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:flex">
              <Toolbar editor={editorInstance} accent={accentColor} orientation="vertical" />
            </div>
          </div>
          <div className="mx-auto w-full max-w-4xl px-5 xl:hidden">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Toolbar editor={editorInstance} accent={accentColor} />
            </div>
          </div>
        </>
      )}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20 flex justify-center px-5 py-4 lg:left-64 lg:px-10"
      >
        <div className="flex w-full max-w-4xl flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-around sm:gap-4 lg:gap-6">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] uppercase tracking-[0.28em] text-[color:var(--editor-muted)]">
            <span>{characterCount.toLocaleString()} characters</span>
            {isPublished && (
              <a
                href={`/posts/${slug}`}
                className="inline-flex items-center gap-2 text-[color:var(--accent)] transition-colors hover:text-[var(--accent)]/80"
              >
                View live
                <Rocket className="h-3.5 w-3.5" aria-hidden />
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={saveSnapshot}
                disabled={!canSaveDraft}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--editor-subtle-border)] px-4 py-3 text-xs uppercase tracking-[0.32em] text-[color:var(--editor-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <Sparkles className="h-4 w-4" aria-hidden />
                Snapshot
              </button>
              <button
                type="button"
                onClick={handleManualSave}
                disabled={!canSaveDraft}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--editor-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--editor-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-60 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <Save className="h-4 w-4" aria-hidden />
                Save draft
              </button>
            </div>
            <button
              type="button"
              onClick={handleOpenPublishModal}
              disabled={isPublishing || isPublished}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#1f0b2a] transition-transform disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              <Rocket className="h-4 w-4" aria-hidden />
              Publish
            </button>
            {isPublished && (
              <button
                type="button"
                onClick={unpublish}
                disabled={isPublishing}
                className="inline-flex items-center gap-2 rounded-md border border-[var(--editor-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <Undo2 className="h-4 w-4" aria-hidden />
                Unpublish
              </button>
            )}
          </div>
        </div>
        {feedback && (
          <p className="mt-3 text-[10px] uppercase tracking-[0.3em] text-[color:var(--editor-muted)]">
            {feedback}
          </p>
        )}
      </nav>
      <PublishModal
        isOpen={isPublishModalOpen}
        title={publishTitleInput}
        summary={publishSummaryInput}
        availableTags={AVAILABLE_TAGS}
        selectedTags={publishTags}
        thumbnail={publishThumbnail}
        thumbnailAlt={publishThumbnailAlt}
        error={publishError}
        isSaving={isPublishing}
        onTitleChange={(value) => setPublishTitleInput(value)}
        onSummaryChange={(value) => setPublishSummaryInput(value)}
        onToggleTag={handleToggleTag}
        onThumbnailChange={(thumbnail) => setPublishThumbnail(thumbnail)}
        onThumbnailAltChange={(value) => setPublishThumbnailAlt(value)}
        onConfirm={handlePublishConfirm}
        onCancel={handlePublishCancel}
      />
    </div>
  );
}
