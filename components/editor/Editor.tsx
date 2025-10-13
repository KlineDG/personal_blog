'use client';

import { useEffect, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/react';
import type { EditorView } from '@tiptap/pm/view';
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
    editorProps: {
      handleKeyDown(_: EditorView, event: KeyboardEvent) {
        if (event.key !== 'Tab' || !editor) {
          return false;
        }

        const INDENT = '  ';

        if (editor.isActive('listItem')) {
          if (event.shiftKey) {
            const lifted = editor.chain().focus().liftListItem('listItem').run();
            if (lifted) {
              event.preventDefault();
              return true;
            }

            return false;
          }

          const sunk = editor.chain().focus().sinkListItem('listItem').run();
          if (sunk) {
            event.preventDefault();
            return true;
          }

          return false;
        }

        const adjusted = editor
          .chain()
          .focus()
          .command(({ tr, state }) => {
            const { $from } = state.selection;
            const depth = $from.depth;
            const block = $from.node(depth);

            if (!block?.isTextblock || block.type.name !== 'paragraph') {
              return false;
            }

            const blockStart = $from.start(depth);

            if (event.shiftKey) {
              const blockTextStart = state.doc.textBetween(blockStart, blockStart + INDENT.length, '\n', '\n');

              if (!blockTextStart.startsWith(INDENT)) {
                return false;
              }

              tr.delete(blockStart, blockStart + INDENT.length);
              return true;
            }

            tr.insertText(INDENT, blockStart);
            return true;
          })
          .run();

        if (adjusted) {
          event.preventDefault();
        }

        return adjusted;
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getJSON());
      onCharacterCountChange?.(editor.storage.characterCount.characters());
    },
  });

  const lastInitial = useRef<string | null>(null);

  useEffect(() => {
    if (!editor) return;

    if (initial == null) {
      lastInitial.current = null;
      return;
    }

    const nextInitial = JSON.stringify(initial);

    if (lastInitial.current === nextInitial) {
      return;
    }

    lastInitial.current = nextInitial;

    const currentContent = JSON.stringify(editor.getJSON());

    if (currentContent === nextInitial) {
      return;
    }

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
      <div className="rounded-lg bg-[color:var(--editor-page-bg)] px-6 py-6">
        <EditorContent editor={editor} className="tiptap" />
      </div>
    </div>
  );
}
