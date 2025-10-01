"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import History from "@tiptap/extension-history";
import TextAlign from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/core";

import { FigureExtension } from "@/components/editor/FigureExtension";
import "@/styles/tiptap.css";

type PostContentProps = {
  content: JSONContent | null;
};

export function PostContent({ content }: PostContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      History,
      Link.configure({ openOnClick: true, autolink: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FigureExtension,
    ],
    content: content ?? { type: "doc", content: [{ type: "paragraph" }] },
    editable: false,
  });

  if (!editor) {
    return (
      <div className="prose prose-zinc mx-auto max-w-3xl dark:prose-invert">
        <div className="h-40 animate-pulse rounded-md bg-zinc-800/40" />
      </div>
    );
  }

  return (
    <div className="prose prose-zinc mx-auto max-w-3xl dark:prose-invert">
      <EditorContent editor={editor} className="tiptap" />
    </div>
  );
}

export default PostContent;
