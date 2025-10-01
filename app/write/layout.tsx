import DraftsSidebar from "@/components/editor/DraftsSidebar";
import EditorShell from "@/components/editor/EditorShell";

export default function WriteLayout({ children }: { children: React.ReactNode }) {
  return <EditorShell sidebar={<DraftsSidebar />}>{children}</EditorShell>;
}

