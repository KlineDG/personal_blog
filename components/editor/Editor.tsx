'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
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
    immediatelyRender: false,
    extensions: [
      StarterKit,
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

  const characterCount = editor ? editor.storage.characterCount.characters() : 0;

  return (
    <div className="space-y-6">
      <div className="lg:hidden">
        <div className="rounded-xl border border-[var(--editor-toolbar-border)] bg-[var(--editor-toolbar-bg)] px-4 py-3 shadow-[var(--editor-shadow)]">
          <Toolbar editor={editor} accent={accentColor} />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_4.5rem]">
        <div className="relative">
          <div className="rounded-[2.5rem] border border-[var(--editor-border)] bg-[var(--editor-soft)] p-6 shadow-[var(--editor-shadow)]">
            <div className="mx-auto w-full max-w-2xl rounded-[2rem] border border-[var(--editor-border)] bg-[var(--editor-card-bg)] px-8 py-10 shadow-[var(--editor-shadow)]">
              <EditorContent editor={editor} className="tiptap" />
            </div>
          </div>
        </div>
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-2xl border border-[var(--editor-toolbar-border)] bg-[var(--editor-toolbar-bg)] p-3 shadow-[var(--editor-shadow)]">
            <Toolbar editor={editor} accent={accentColor} orientation="vertical" />
          </div>
        </aside>
      </div>
      <div className="text-xs text-[color:var(--editor-muted)]">
        {characterCount} characters
      </div>
    </div>
  );
}
