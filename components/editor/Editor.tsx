'use client';

import { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import type { JSONContent } from '@tiptap/core';

import { FigureExtension } from './FigureExtension';
import '@/styles/tiptap.css';

type EditorProps = {
  readonly initial: JSONContent | null;
  readonly onChange: (json: JSONContent) => void;
  readonly onReady?: (editor: TiptapEditor | null) => void;
};

export default function Editor({ initial, onChange, onReady }: EditorProps) {
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

  useEffect(() => {
    onReady?.(editor ?? null);
    return () => {
      onReady?.(null);
    };
  }, [editor, onReady]);

  const characterCount = editor ? editor.storage.characterCount.characters() : 0;

  return (
    <div className="space-y-6">
      <div className="mx-auto w-full max-w-3xl">
        <EditorContent editor={editor} className="tiptap" />
      </div>
      <div className="text-xs text-[color:var(--editor-muted)]">
        {characterCount} characters
      </div>
    </div>
  );
}
