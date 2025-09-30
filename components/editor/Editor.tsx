'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import CharacterCount from '@tiptap/extension-character-count';
import TextAlign from '@tiptap/extension-text-align';
import { JSONContent } from '@tiptap/core';
import { FigureExtension } from './FigureExtension';
import Toolbar from './Toolbar';
import '@/styles/tiptap.css';


export default function Editor({ initial, onChange }: { initial: JSONContent | null; onChange: (json: JSONContent) => void; }) {
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


return (
<div className="space-y-3">
<Toolbar editor={editor} />
<div className="border rounded-md p-4 min-h-[60vh]">
<EditorContent editor={editor} className="tiptap" />
</div>
<div className="text-xs text-slate-500">
{editor ? editor.storage.characterCount.characters() : 0} chars
</div>
</div>
);
}