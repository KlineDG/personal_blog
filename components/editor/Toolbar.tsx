
"use client";

import { useRef, type ChangeEvent } from "react";
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
      className={`group flex items-center gap-2 rounded-md border border-[var(--editor-toolbar-border)] bg-transparent text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--editor-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-50 hover:border-[var(--accent)] hover:bg-[var(--editor-soft)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0 ${orientation === "vertical" ? "w-full px-3 py-2" : "px-3 py-2"}`}
      style={{
        borderColor: active ? accent : "var(--editor-toolbar-border)",
        color: active ? accent : undefined,
        backgroundColor: active ? "var(--editor-soft)" : undefined,
        boxShadow: active ? `0 0 0 1px ${accent}` : undefined,
      }}
    >
      <Icon className="h-4 w-4" aria-hidden />
      {orientation === "vertical" ? (
        <span className="text-[10px] tracking-[0.3em]">{label}</span>
      ) : (
        <span className="sr-only">{label}</span>
      )}
    </button>
  );

  const pickImage = () => fileRef.current?.click();

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
          ? "flex flex-col gap-2"
          : "flex flex-wrap items-center gap-2"
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
        onClick: () => editor.chain().focus().setFigureAlign("left").run(),
      })}
      {button({
        icon: AlignCenter,
        label: "Align center",
        onClick: () => editor.chain().focus().setFigureAlign("center").run(),
      })}
      {button({
        icon: AlignRight,
        label: "Align right",
        onClick: () => editor.chain().focus().setFigureAlign("right").run(),
      })}
    </div>
  );
}
