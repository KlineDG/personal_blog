import type { ReactNode } from "react";

import DraftsSidebar from "@/components/editor/DraftsSidebar";
import { EditorShell } from "@/components/editor/EditorShell";

export default function WriteLayout({ children }: { children: ReactNode }) {
  return <EditorShell sidebar={<DraftsSidebar />}>{children}</EditorShell>;
}
