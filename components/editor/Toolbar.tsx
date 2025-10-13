
"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { Editor } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import type { Align } from "./FigureExtension";

type ToolbarOrientation = "horizontal" | "vertical";

type ToolbarProps = {
  readonly editor: Editor | null;
  readonly accent?: string;
  readonly orientation?: ToolbarOrientation;
};

export default function Toolbar({
  editor,
  accent = "#d4afe3",
  orientation = "horizontal",
}: ToolbarProps) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [, setRenderCount] = useState(0);

  useEffect(() => {
    if (!editor) return;

    const forceUpdate = () => setRenderCount((count) => count + 1);

    editor.on("transaction", forceUpdate);
    editor.on("selectionUpdate", forceUpdate);
    editor.on("focus", forceUpdate);
    editor.on("blur", forceUpdate);

    return () => {
      editor.off("transaction", forceUpdate);
      editor.off("selectionUpdate", forceUpdate);
      editor.off("focus", forceUpdate);
      editor.off("blur", forceUpdate);
    };
  }, [editor]);

  if (!editor) return null;

  const button = ({
    icon: Icon,
    label,
    onClick,
    active = false,
    disabled = false,
  }: {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`group flex items-center justify-center rounded-md border border-[var(--editor-toolbar-border)] px-3 py-2.5 text-[color:var(--editor-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 ${
        orientation === "vertical"
          ? "w-12"
          : "min-w-[2.75rem]"
      }`}
      style={{
        borderColor: active ? accent : "var(--editor-toolbar-border)",
        color: active ? accent : undefined,
        backgroundColor: active ? "var(--editor-soft)" : undefined,
        boxShadow: active ? `0 0 0 1px ${accent}` : undefined,
      }}
    >
      <Icon className="h-4 w-4" aria-hidden />
    </button>
  );

  const pickImage = () => fileRef.current?.click();

  const setTextAlignment = (alignment: Align) => {
    const chain = editor.chain().focus();

    if (alignment === "left") {
      chain.unsetTextAlign();
    } else {
      chain.setTextAlign(alignment);
    }

    chain.run();
  };

  const isTextAlignmentActive = (alignment: Align) => {
    if (alignment === "left") {
      const centerActive = editor.isActive({ textAlign: "center" });
      const rightActive = editor.isActive({ textAlign: "right" });

      return editor.isActive({ textAlign: "left" }) || (!centerActive && !rightActive);
    }

    return editor.isActive({ textAlign: alignment });
  };

  const figureAttributes = editor.getAttributes("figure") as { align?: Align };
  const figureAlign = figureAttributes?.align ?? "center";
  const isFigureSelected = editor.isActive("figure");

  const onPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const path = `posts/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("post-images")
      .upload(path, file, { cacheControl: "3600", upsert: false });

    if (error) {
      alert(`Upload failed: ${error.message}`);
      return;
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(path);
    editor.chain().focus().setFigure({ src: data.publicUrl, alt: "", caption: "", align: "center" }).run();
    event.target.value = "";
  };

  return (
    <div
      className={
        orientation === "vertical"
          ? "flex flex-col items-center gap-2"
          : "flex flex-wrap items-center justify-center gap-2"
      }
    >
      {button({
        icon: Bold,
        label: "Bold",
        onClick: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
      })}
      {button({
        icon: Italic,
        label: "Italic",
        onClick: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
      })}
      {button({
        icon: Heading1,
        label: "Heading 1",
        onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        active: editor.isActive("heading", { level: 1 }),
      })}
      {button({
        icon: Heading2,
        label: "Heading 2",
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        active: editor.isActive("heading", { level: 2 }),
      })}
      {button({
        icon: Heading3,
        label: "Heading 3",
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        active: editor.isActive("heading", { level: 3 }),
      })}
      {button({
        icon: List,
        label: "Bulleted list",
        onClick: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
      })}
      {button({
        icon: ListOrdered,
        label: "Ordered list",
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
      })}
      {button({
        icon: Quote,
        label: "Quote",
        onClick: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
      })}
      {button({
        icon: Code2,
        label: "Code block",
        onClick: () => editor.chain().focus().toggleCodeBlock().run(),
        active: editor.isActive("codeBlock"),
      })}
      {button({ icon: ImageIcon, label: "Image", onClick: pickImage })}
      <input ref={fileRef} onChange={onPick} type="file" accept="image/*" hidden />
      <div
        className={
          orientation === "vertical"
            ? "my-1 h-px bg-[var(--editor-border)]"
            : "mx-1 h-6 w-px bg-[var(--editor-border)]"
        }
        aria-hidden
      />
      {button({
        icon: AlignLeft,
        label: "Align left",
        onClick: () => setTextAlignment("left"),
        active: isTextAlignmentActive("left"),
      })}
      {button({
        icon: AlignCenter,
        label: "Align center",
        onClick: () => setTextAlignment("center"),
        active: isTextAlignmentActive("center"),
      })}
      {button({
        icon: AlignRight,
        label: "Align right",
        onClick: () => setTextAlignment("right"),
        active: isTextAlignmentActive("right"),
      })}
      {isFigureSelected && (
        <>
          <div
            className={
              orientation === "vertical"
                ? "my-1 h-px bg-[var(--editor-border)]"
                : "mx-1 h-6 w-px bg-[var(--editor-border)]"
            }
            aria-hidden
          />
          {button({
            icon: AlignLeft,
            label: "Image align left",
            onClick: () => editor.chain().focus().setFigureAlign("left").run(),
            active: figureAlign === "left",
          })}
          {button({
            icon: AlignCenter,
            label: "Image align center",
            onClick: () => editor.chain().focus().setFigureAlign("center").run(),
            active: figureAlign === "center",
          })}
          {button({
            icon: AlignRight,
            label: "Image align right",
            onClick: () => editor.chain().focus().setFigureAlign("right").run(),
            active: figureAlign === "right",
          })}
        </>
      )}
    </div>
  );
}
