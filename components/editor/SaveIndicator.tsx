'use client';
export default function SaveIndicator({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
const text = state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : state === 'error' ? 'Error' : '';
const color = state === 'saved' ? 'text-green-600' : state === 'error' ? 'text-red-600' : 'text-slate-500';
return <span className={`text-sm ${color}`}>{text}</span>;
}