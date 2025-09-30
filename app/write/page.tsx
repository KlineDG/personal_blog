'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';


function slugify(s: string) {
return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}


export default function WriteIndex() {
const supabase = createClient();
const router = useRouter();


useEffect(() => {
(async () => {
const title = 'Untitled';
const slug = `untitled-${(Math.random().toString(36).slice(2, 8))}`;
const user = (await supabase.auth.getUser()).data.user;
if (!user) { alert('Sign in first'); return; }
const { data, error } = await supabase.from('posts').insert({
author_id: user.id,
title,
slug,
status: 'draft',
content_json: { type: 'doc', content: [{ type: 'paragraph' }] },
}).select('slug').single();
if (error) { alert(error.message); return; }
router.replace(`/write/${data.slug}`);
})();
}, []);


return <div className="p-4 text-sm text-slate-500">Creating draft…</div>;
}