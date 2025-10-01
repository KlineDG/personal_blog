'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import type { JSONContent } from '@tiptap/core';

import { useEditorTheme } from './EditorShell';
import { FigureExtension } from './FigureExtension';
import Toolbar from './Toolbar';
import '@/styles/tiptap.css';

type EditorProps = {
  readonly initial: JSONContent | null;
  readonly onChange: (json: JSONContent) => void;
};

export default function Editor({ initial, onChange }: EditorProps) {
  const { accentColor } = useEditorTheme();
  const editor = useEditor({
    extensions: [
      StarterKit,
      History,
      Link.configure({ openOnClick: true, autolink: true }),
      Placeholder.configure({ placeholder: 'Start writing…' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      FigureExtension,
    ],
    content: initial ?? { type: 'doc', content: [{ type: 'paragraph' }] },
    autofocus: false,
    onUpdate({ editor }) {
      onChange(editor.getJSON());
    },
  });

  useEffect(() => {
    if (!editor || !initial) return;
    editor.commands.setContent(initial, false);
  }, [editor, initial]);

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border border-[var(--editor-toolbar-border)] bg-[var(--editor-toolbar-bg)] px-4 py-3 shadow-[var(--editor-shadow)]"
      >
        <Toolbar editor={editor} accent={accentColor} />
      </div>
      <div className="rounded-2xl border border-[var(--editor-border)] bg-[var(--editor-card-bg)] p-6 shadow-[var(--editor-shadow)]">
        <EditorContent editor={editor} className="tiptap" />
      </div>
      <div className="text-xs text-[color:var(--editor-muted)]">
        {editor ? editor.storage.characterCount.characters() : 0} characters
      </div>
    </div>
  );
}