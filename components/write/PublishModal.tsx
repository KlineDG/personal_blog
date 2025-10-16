"use client";

import { type ChangeEvent, useCallback, useId } from "react";
import Image from "next/image";

export type PublishThumbnail = {
  readonly url: string;
  readonly source: "preset" | "upload" | "remote";
  readonly name?: string | null;
};

export type PublishModalProps = {
  readonly isOpen: boolean;
  readonly title: string;
  readonly summary: string;
  readonly availableTags: readonly string[];
  readonly selectedTags: readonly string[];
  readonly thumbnail: PublishThumbnail | null;
  readonly thumbnailAlt: string;
  readonly error: string | null;
  readonly isSaving: boolean;
  readonly onTitleChange: (value: string) => void;
  readonly onSummaryChange: (value: string) => void;
  readonly onToggleTag: (tag: string) => void;
  readonly onThumbnailChange: (thumbnail: PublishThumbnail | null) => void;
  readonly onThumbnailAltChange: (value: string) => void;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
};

const PRESET_THUMBNAILS: ReadonlyArray<{
  readonly src: string;
  readonly alt: string;
  readonly label: string;
}> = [
  {
    src: "/thumbnails/ideas-flow.svg",
    alt: "Abstract wave lines over a lavender and blue gradient background",
    label: "Ideas in flow",
  },
  {
    src: "/thumbnails/morning-pages.svg",
    alt: "Sunrise gradient with stylised mountain layers",
    label: "Morning pages",
  },
  {
    src: "/thumbnails/notebook-atlas.svg",
    alt: "Notebook grid with colourful connecting routes",
    label: "Notebook atlas",
  },
  {
    src: "/thumbnails/soundtrack-notes.svg",
    alt: "Night sky gradient with neon waveform arcs",
    label: "Soundtrack notes",
  },
];

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PublishModal({
  isOpen,
  title,
  summary,
  availableTags,
  selectedTags,
  thumbnail,
  thumbnailAlt,
  error,
  isSaving,
  onTitleChange,
  onSummaryChange,
  onToggleTag,
  onThumbnailChange,
  onThumbnailAltChange,
  onConfirm,
  onCancel,
}: PublishModalProps) {
  const titleId = useId();
  const summaryId = useId();
  const fileInputId = useId();
  const altInputId = useId();

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.currentTarget.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          onThumbnailChange({
            url: result,
            source: "upload",
            name: file.name,
          });
          if (!thumbnailAlt.trim()) {
            const baseName = file.name.replace(/\.[^.]+$/, "");
            onThumbnailAltChange(baseName);
          }
        }
      };
      reader.readAsDataURL(file);
      event.currentTarget.value = "";
    },
    [onThumbnailChange, onThumbnailAltChange, thumbnailAlt],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 py-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-3xl rounded-2xl border border-[color:var(--editor-border)] bg-[color:var(--editor-page-bg)] shadow-2xl"
      >
        <div className="flex flex-col gap-6 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                id={titleId}
                className="text-xl font-semibold text-[color:var(--editor-page-text)] sm:text-2xl"
              >
                Publish post
              </h2>
              <p className="mt-1 text-sm text-[color:var(--editor-muted)]">
                Add the final details before sharing this story publicly.
              </p>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--editor-muted)] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              Close
            </button>
          </div>

          <div className="grid gap-4">
            <label className="space-y-2 text-sm text-[color:var(--editor-muted)]" htmlFor={`${titleId}-input`}>
              <span className="uppercase tracking-[0.3em]">Title</span>
              <input
                id={`${titleId}-input`}
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                className="w-full rounded-lg border border-[color:var(--editor-border)] bg-transparent px-3 py-2 text-base text-[color:var(--editor-page-text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                placeholder="Give your post a compelling headline"
              />
            </label>

            <label className="space-y-2 text-sm text-[color:var(--editor-muted)]" htmlFor={`${summaryId}-input`}>
              <span className="uppercase tracking-[0.3em]">Summary</span>
              <textarea
                id={`${summaryId}-input`}
                value={summary}
                onChange={(event) => onSummaryChange(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[color:var(--editor-border)] bg-transparent px-3 py-2 text-base text-[color:var(--editor-page-text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                placeholder="What should readers know before they dive in?"
              />
            </label>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)]">
              Tags
            </span>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const isActive = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => onToggleTag(tag)}
                    aria-pressed={isActive}
                    className={classNames(
                      "rounded-full border px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0",
                      isActive
                        ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                        : "border-[color:var(--editor-border)] text-[color:var(--editor-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)]">
                Thumbnail
              </span>
              <button
                type="button"
                onClick={() => {
                  onThumbnailChange(null);
                  onThumbnailAltChange("");
                }}
                className="self-start rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[color:var(--editor-muted)] transition hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                Clear selection
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--editor-muted)]">
                  Choose a preset
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {PRESET_THUMBNAILS.map((item) => {
                    const isSelected = thumbnail?.source === "preset" && thumbnail.url === item.src;
                    return (
                      <button
                        key={item.src}
                        type="button"
                        onClick={() => {
                          onThumbnailChange({
                            url: item.src,
                            source: "preset",
                            name: item.label,
                          });
                          onThumbnailAltChange(item.alt);
                        }}
                        className={classNames(
                          "relative overflow-hidden rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0",
                          isSelected
                            ? "border-[var(--accent)] shadow-[0_0_0_3px] shadow-[color:var(--accent)]/20"
                            : "border-[color:var(--editor-border)] hover:border-[var(--accent)]",
                        )}
                      >
                        <Image
                          src={item.src}
                          alt={item.alt}
                          width={320}
                          height={240}
                          className="h-28 w-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.28em] text-white">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--editor-muted)]">
                  Upload your own
                </p>
                <label
                  htmlFor={fileInputId}
                  className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[color:var(--editor-border)] p-6 text-center text-sm text-[color:var(--editor-muted)] transition hover:border-[var(--accent)]"
                >
                  <span className="uppercase tracking-[0.3em]">Select image</span>
                  <span className="text-[11px] text-[color:var(--editor-muted)]">
                    High-resolution images work best.
                  </span>
                  <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                </label>
                {thumbnail && (
                  <div className="overflow-hidden rounded-xl border border-[color:var(--editor-border)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumbnail.url}
                      alt={thumbnailAlt || "Selected thumbnail preview"}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                )}
                <label className="space-y-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--editor-muted)]" htmlFor={altInputId}>
                  Alt text
                  <input
                    id={altInputId}
                    value={thumbnailAlt}
                    onChange={(event) => onThumbnailAltChange(event.target.value)}
                    placeholder="Describe the thumbnail for screen readers"
                    className="w-full rounded-lg border border-[color:var(--editor-border)] bg-transparent px-3 py-2 text-sm text-[color:var(--editor-page-text)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40"
                  />
                </label>
              </div>
            </div>
          </div>

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50/70 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--editor-border)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[color:var(--editor-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--accent)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.32em] text-[#1f0b2a] transition disabled:cursor-not-allowed disabled:opacity-60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              {isSaving ? "Publishing…" : "Confirm publish"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
