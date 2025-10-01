"use client";

import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import History from "@tiptap/extension-history";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/core";

import { FigureExtension } from "./FigureExtension";
import "@/styles/tiptap.css";

type ReadOnlyContentProps = {
  readonly content: JSONContent | null;
};

export default function ReadOnlyContent({ content }: ReadOnlyContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      History,
      Link.configure({ openOnClick: true, autolink: true }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FigureExtension,
    ],
    content: content ?? { type: "doc", content: [] },
    editable: false,
    injectCSS: false,
  });

  useEffect(() => {
    if (!editor) return;
    if (!content) return;
    editor.commands.setContent(content, false);
  }, [content, editor]);

  return <EditorContent editor={editor} className="tiptap" />;
}
