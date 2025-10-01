'use client';

import { Editor } from '@tiptap/react';
import { useRef } from 'react';

import { createClient } from '@/lib/supabase/client';

export default function Toolbar({ editor, accent = '#C6A6FB' }: { editor: Editor | null; accent?: string }) {
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!editor) return null;

  const button = (opts: { label: string; onClick: () => void; active?: boolean; disabled?: boolean; title?: string }) => (
    <button
      onClick={opts.onClick}
      disabled={opts.disabled}
      title={opts.title}
      className={`px-2 py-1 rounded border text-sm disabled:opacity-40 ${opts.active ? '' : 'border-transparent'} hover:bg-muted/50`}
      style={
        opts.active
          ? {
              color: accent,
              borderColor: accent,
              boxShadow: `0 0 0 1px ${accent}`,
            }
          : undefined
      }
    >
      {opts.label}
    </button>
  );

  const pickImage = () => fileRef.current?.click();

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop();
    const path = `posts/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from('post-images')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) {
      alert('Upload failed: ' + error.message);
      return;
    }

    const { data } = supabase.storage.from('post-images').getPublicUrl(path);

    editor.chain().focus().setFigure({ src: data.publicUrl, alt: '', caption: '', align: 'center' }).run();

    e.target.value = '';
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {button({ label: 'B', title: 'Bold', onClick: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold') })}
      {button({ label: 'I', title: 'Italic', onClick: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic') })}
      {button({ label: 'H1', onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }) })}
      {button({ label: 'H2', onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }) })}
      {button({ label: 'H3', onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }) })}
      {button({ label: '• List', onClick: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList') })}
      {button({ label: '1. List', onClick: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList') })}
      {button({ label: '❝', title: 'Callout/Quote', onClick: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote') })}
      {button({ label: '</>', title: 'Code', onClick: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock') })}
      {button({ label: 'Image', onClick: pickImage })}
      <input ref={fileRef} onChange={onPick} type="file" accept="image/*" hidden />
      <div className="mx-2" />
      {button({ label: 'Align L', onClick: () => editor.chain().focus().setFigureAlign('left').run() })}
      {button({ label: 'Align C', onClick: () => editor.chain().focus().setFigureAlign('center').run() })}
      {button({ label: 'Align R', onClick: () => editor.chain().focus().setFigureAlign('right').run() })}
    </div>
  );
}
