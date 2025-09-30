'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { JSONContent } from '@tiptap/core';
import Editor from '@/components/editor/Editor';
import SaveIndicator from '@/components/editor/SaveIndicator';
import { createClient } from '@/lib/supabase/client';


function slugify(s: string) {
return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}


export default function WriteSlugPage() {
const supabase = createClient();
const params = useParams();
const router = useRouter();
const slug = String(params.slug);
const [postId, setPostId] = useState<string>('');
const [title, setTitle] = useState('');
const [content, setContent] = useState<JSONContent | null>(null);
const [saving, setSaving] = useState<'idle'|'saving'|'saved'|'error'>('idle');

// Load existing post
useEffect(() => {
(async () => {
const user = (await supabase.auth.getUser()).data.user;
if (!user) { alert('Sign in first'); router.replace('/'); return; }
const { data, error } = await supabase
.from('posts')
.select('id,title,content_json,author_id,status')
.eq('slug', slug)
.maybeSingle();
if (error) { alert(error.message); return; }
if (!data) { alert('Draft not found'); router.replace('/write'); return; }
setPostId(data.id);
setTitle(data.title || 'Untitled');
setContent(data.content_json as any);
})();
}, [slug]);


// Debounced autosave
useEffect(() => {
if (!postId) return;
setSaving('saving');
const t = setTimeout(async () => {
const { error } = await supabase
.from('posts')
.update({ title, content_json: content })
.eq('id', postId);
setSaving(error ? 'error' : 'saved');
if (!error) setTimeout(()=>setSaving('idle'), 1000);
}, 1200);
return () => clearTimeout(t);
}, [title, content, postId]);


// Manual save version (⌘/Ctrl+S)
useEffect(() => {
const onKey = async (e: KeyboardEvent) => {
if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
e.preventDefault(); await saveVersion();
}
};
window.addEventListener('keydown', onKey);
return () => window.removeEventListener('keydown', onKey);
}, [postId, title, content]);


const saveVersion = async () => {
if (!postId) return;
const user = (await supabase.auth.getUser()).data.user;
if (!user) return;
const { error } = await supabase.from('post_versions').insert({
post_id: postId,
actor_id: user.id,
title,
content_json: content,
});
if (error) alert('Save version failed: ' + error.message); else alert('Version saved');
};


const publish = async () => {
if (!postId) return;
const { error } = await supabase
.from('posts')
.update({ status: 'published', published_at: new Date().toISOString() })
.eq('id', postId);
if (error) alert(error.message); else alert('Published');
};


const unpublish = async () => {
if (!postId) return;
const { error } = await supabase
.from('posts')
.update({ status: 'draft', published_at: null })
.eq('id', postId);
if (error) alert(error.message); else alert('Unpublished');
};

return (
<div className="max-w-4xl">
<div className="flex items-center gap-3 mb-4">
<input
value={title}
onChange={(e)=>setTitle(e.target.value)}
placeholder="Post title"
className="text-2xl font-semibold bg-transparent outline-none border-b border-transparent focus:border-b-muted p-1 flex-1"
/>
<SaveIndicator state={saving} />
<button onClick={saveVersion} className="border rounded px-2 py-1 text-sm">Save version (⌘/Ctrl+S)</button>
<button onClick={publish} className="bg-black text-white rounded px-3 py-1 text-sm">Publish</button>
<button onClick={unpublish} className="border rounded px-3 py-1 text-sm">Unpublish</button>
</div>


<Editor initial={content} onChange={setContent} />
</div>
);
}