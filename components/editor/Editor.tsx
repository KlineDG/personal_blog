"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import History from "@tiptap/extension-history";
import CharacterCount from "@tiptap/extension-character-count";
import TextAlign from "@tiptap/extension-text-align";
import type { JSONContent } from "@tiptap/core";

import { useEditorTheme } from "./EditorShell";
import { FigureExtension } from "./FigureExtension";
import Toolbar from "./Toolbar";
import "@/styles/tiptap.css";

type EditorProps = {
  readonly initial: JSONContent | null;
  readonly onChange: (json: JSONContent) => void;
};

export default function Editor({ initial, onChange }: EditorProps) {
  const { tokens } = useEditorTheme();
  const editor = useEditor({
    extensions: [
      StarterKit,
      History,
      Link.configure({ openOnClick: true, autolink: true }),
      Placeholder.configure({ placeholder: "Start writing…" }),
      CharacterCount,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FigureExtension,
    ],
    content: initial ?? { type: "doc", content: [{ type: "paragraph" }] },
    autofocus: false,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  return (
    <div className="space-y-3">
      <Toolbar editor={editor} />
      <div className={`rounded-md p-4 transition-colors duration-300 ${tokens.surface}`}>
        <EditorContent editor={editor} className="tiptap min-h-[60vh]" />
      </div>
      <div className={`text-xs ${tokens.muted}`}>
        {editor ? editor.storage.characterCount.characters() : 0} chars
      </div>
    </div>
  );
}
