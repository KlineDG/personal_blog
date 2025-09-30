import DraftsSidebar from '@/components/editor/DraftsSidebar';


export default function WriteLayout({ children }: { children: React.ReactNode }) {
return (
<div className="min-h-screen grid grid-cols-[18rem_1fr]">
<DraftsSidebar />
<div className="p-4">{children}</div>
</div>
);
}