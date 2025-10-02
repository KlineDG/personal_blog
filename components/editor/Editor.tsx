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
  readonly onCharacterCountChange?: (count: number) => void;
};

export default function Editor({ initial, onChange, onReady, onCharacterCountChange }: EditorProps) {
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
      onCharacterCountChange?.(editor.storage.characterCount.characters());
    },
  });

  useEffect(() => {
    if (!editor || !initial) return;
    editor.commands.setContent(initial, false);
    onCharacterCountChange?.(editor.storage.characterCount.characters());
  }, [editor, initial, onCharacterCountChange]);

  useEffect(() => {
    onReady?.(editor ?? null);
    if (editor) {
      onCharacterCountChange?.(editor.storage.characterCount.characters());
    }
    return () => {
      onReady?.(null);
    };
  }, [editor, onCharacterCountChange, onReady]);

  return (
    <div className="mx-auto w-full max-w-4xl px-5">
      <div className="rounded-lg bg-[color:var(--editor-page-bg)] px-6 py-8">
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
}
