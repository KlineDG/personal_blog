'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';


export default function DraftsSidebar() {
const supabase = createClient();
const [drafts, setDrafts] = useState<any[]>([]);
const [q, setQ] = useState('');


useEffect(() => {
(async () => {
const { data } = await supabase
.from('posts')
.select('id,title,slug,updated_at')
.eq('status', 'draft')
.eq('is_deleted', false)
.order('updated_at', { ascending: false })
.limit(50);
setDrafts(data ?? []);
})();
}, []);


const filtered = drafts.filter(d => (d.title || '').toLowerCase().includes(q.toLowerCase()));


return (
<aside className="w-72 border-r h-full flex flex-col">
<div className="p-3 border-b flex gap-2 items-center">
<Link href="/write" className="px-2 py-1 rounded bg-black text-white text-sm">New Post</Link>
<input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search drafts" className="flex-1 text-sm border rounded px-2 py-1" />
</div>
<div className="flex-1 overflow-auto">
{filtered.map(d => (
<Link key={d.id} href={`/write/${d.slug}`} className="block px-3 py-2 hover:bg-muted/50">
<div className="text-sm font-medium truncate">{d.title || 'Untitled'}</div>
<div className="text-xs text-slate-500">{new Date(d.updated_at).toLocaleString()}</div>
</Link>
))}
{filtered.length === 0 && (
<div className="p-3 text-sm text-slate-500">No drafts yet.</div>
)}
</div>
</aside>
);
}

