"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderPlus, FilePlus } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { useEditorTheme } from "./EditorShell";

type DraftSummary = {
  readonly id: string;
  readonly title: string | null;
  readonly slug: string;
  readonly updated_at: string | null;
};

type DraftEventDetail = {
  readonly id: string;
  readonly title?: string;
  readonly slug?: string;
};

type CustomFileNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "file";
};

type CustomFolderNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "folder";
  readonly children: readonly CustomTreeNode[];
};

type CustomTreeNode = CustomFolderNode | CustomFileNode;

type DraftTreeNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "draft";
  readonly slug: string;
  readonly updatedAt: string | null;
};

type FolderTreeNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "folder";
  readonly origin: "system" | "custom";
  readonly children: readonly TreeNode[];
};

type CustomFileTreeNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "file";
  readonly origin: "custom";
};

type MessageTreeNode = {
  readonly id: string;
  readonly message: string;
  readonly type: "message";
};

type TreeNode = DraftTreeNode | FolderTreeNode | CustomFileTreeNode | MessageTreeNode;

type TreeNodeItemProps = {
  readonly node: TreeNode;
  readonly depth: number;
  readonly accentColor: string;
  readonly expandedFolders: readonly string[];
  readonly activeSlug: string | null;
  readonly onToggle: (folderId: string) => void;
  readonly onCreateFolder: (parentId: string | null) => void;
  readonly onCreateFile: (parentId: string | null) => void;
};

const toTitle = (title: string | null) => (title && title.trim().length > 0 ? title : "Untitled draft");

const createNodeId = (prefix: string) => {
  const random = globalThis.crypto?.randomUUID?.();
  if (random) {
    return `${prefix}-${random}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
};

const addCustomNode = (
  nodes: readonly CustomTreeNode[],
  parentId: string | null,
  newNode: CustomTreeNode,
): readonly CustomTreeNode[] => {
  if (!parentId) {
    return [...nodes, newNode];
  }

  return nodes.map((node) => {
    if (node.type !== "folder") {
      return node;
    }
    if (node.id === parentId) {
      return { ...node, children: [...node.children, newNode] };
    }
    return { ...node, children: addCustomNode(node.children, parentId, newNode) };
  });
};

const convertCustomNodes = (nodes: readonly CustomTreeNode[]): readonly TreeNode[] =>
  nodes.map((node) =>
    node.type === "folder"
      ? {
          id: node.id,
          name: node.name,
          type: "folder" as const,
          origin: "custom" as const,
          children: convertCustomNodes(node.children),
        }
      : { id: node.id, name: node.name, type: "file" as const, origin: "custom" as const },
  );

const formatUpdatedAt = (updatedAt: string | null) =>
  updatedAt ? new Date(updatedAt).toLocaleString() : "Never saved";

function TreeNodeItem({
  node,
  depth,
  accentColor,
  expandedFolders,
  activeSlug,
  onToggle,
  onCreateFolder,
  onCreateFile,
}: TreeNodeItemProps) {
  const indentStyle = { paddingLeft: `${depth * 0.75}rem` };

  if (node.type === "folder") {
    const isExpanded = expandedFolders.includes(node.id);

    return (
      <li>
        <div
          className="group flex items-center justify-between rounded-md px-2 py-1 text-sm font-medium text-[color:var(--editor-muted)] transition-colors hover:bg-[var(--editor-soft)] hover:text-[color:var(--editor-page-text)]"
          style={indentStyle}
        >
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="flex flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          >
            <span aria-hidden className="text-[0.65rem]">
              {isExpanded ? "▾" : "▸"}
            </span>
            <span aria-hidden className="text-base">{node.origin === "system" ? "📂" : "🗂"}</span>
            <span className="truncate">{node.name}</span>
          </button>
          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCreateFolder(node.id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-dashed border-[var(--editor-border)] text-[0.7rem] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              <span aria-hidden>📁+</span>
              <span className="sr-only">Create folder inside {node.name}</span>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCreateFile(node.id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-dashed border-[var(--editor-border)] text-[0.7rem] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              <span aria-hidden>📄+</span>
              <span className="sr-only">Create file inside {node.name}</span>
            </button>
          </div>
        </div>
        {isExpanded && node.children.length > 0 && (
          <ul className="mt-1 space-y-1">
            {node.children.map((child) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                accentColor={accentColor}
                expandedFolders={expandedFolders}
                activeSlug={activeSlug}
                onToggle={onToggle}
                onCreateFolder={onCreateFolder}
                onCreateFile={onCreateFile}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (node.type === "draft") {
    const isActive = activeSlug === node.slug;

    return (
      <li>
        <Link
          href={`/write/${node.slug}`}
          className="group flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-[var(--editor-soft)]"
          style={{
            ...indentStyle,
            color: isActive ? accentColor : "var(--editor-page-text)",
            borderColor: isActive ? accentColor : undefined,
            backgroundColor: isActive ? "var(--editor-soft)" : undefined,
          }}
          title={formatUpdatedAt(node.updatedAt)}
        >
          <span aria-hidden className="text-base">📄</span>
          <span className="truncate group-hover:text-[var(--accent)]" style={isActive ? { color: accentColor } : undefined}>
            {node.name}
          </span>
        </Link>
      </li>
    );
  }

  if (node.type === "file") {
    return (
      <li>
        <div
          className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-[color:var(--editor-muted)]"
          style={indentStyle}
        >
          <span aria-hidden className="text-base">📝</span>
          <span className="truncate">{node.name}</span>
        </div>
      </li>
    );
  }

  return (
    <li>
      <div
        className="px-2 py-1 text-[0.8rem] text-[color:var(--editor-muted)]"
        style={indentStyle}
      >
        {node.message}
      </div>
    </li>
  );
}

export default function DraftsSidebar() {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const { accentColor } = useEditorTheme();
  const [drafts, setDrafts] = useState<readonly DraftSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [customTree, setCustomTree] = useState<readonly CustomTreeNode[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<readonly string[]>(["drafts-root"]);

  const fetchDrafts = useMemo(
    () =>
      async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id,title,slug,updated_at")
          .eq("status", "draft")
          .eq("is_deleted", false)
          .order("updated_at", { ascending: false })
          .limit(100);
        if (!error) {
          setDrafts(data ?? []);
        }
        setLoading(false);
      },
    [supabase],
  );

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  useEffect(() => {
    const onRefresh = () => fetchDrafts();
    const onDraftUpdated: EventListener = (event) => {
      const detail = (event as CustomEvent<DraftEventDetail>).detail;
      if (!detail) return;
      setDrafts((prev) =>
        prev.map((draft) => (draft.id === detail.id ? { ...draft, ...detail } : draft)),
      );
    };

    window.addEventListener("editor:refresh-drafts", onRefresh);
    window.addEventListener("editor:draft-updated", onDraftUpdated);
    return () => {
      window.removeEventListener("editor:refresh-drafts", onRefresh);
      window.removeEventListener("editor:draft-updated", onDraftUpdated);
    };
  }, [fetchDrafts]);

  const filteredDrafts = drafts.filter((draft) =>
    toTitle(draft.title).toLowerCase().includes(query.trim().toLowerCase()),
  );

  const activeSlug = useMemo(() => {
    if (!pathname) return null;
    if (!pathname.startsWith("/write/")) return null;
    const [, slug = null] = pathname.split("/write/");
    return slug ? slug.split("/")[0] : null;
  }, [pathname]);

  const workspaceTree = useMemo(() => {
    const draftChildren: readonly TreeNode[] = loading
      ? [{ id: "drafts-loading", type: "message", message: "Loading drafts…" }]
      : filteredDrafts.length > 0
        ? filteredDrafts.map((draft) => ({
            id: draft.id,
            name: toTitle(draft.title),
            type: "draft" as const,
            slug: draft.slug,
            updatedAt: draft.updated_at,
          }))
        : [
            {
              id: "drafts-empty",
              type: "message" as const,
              message: query.trim().length > 0 ? "No drafts match your search." : "No drafts yet. Start something new.",
            },
          ];

    const draftsFolder: FolderTreeNode = {
      id: "drafts-root",
      name: "Drafts",
      type: "folder",
      origin: "system",
      children: draftChildren,
    };

    const customNodes = convertCustomNodes(customTree);

    return [draftsFolder, ...customNodes];
  }, [customTree, filteredDrafts, loading, query]);

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
    );
  }, []);

  const handleCreateFolder = useCallback((parentId: string | null) => {
    const name = window.prompt("Name this folder");
    const trimmed = name?.trim();
    if (!trimmed) {
      return;
    }
    const id = createNodeId("folder");
    setCustomTree((prev) => addCustomNode(prev, parentId, { type: "folder", id, name: trimmed, children: [] }));
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (parentId) {
        next.add(parentId);
      }
      next.add(id);
      return Array.from(next);
    });
  }, []);

  const handleCreateFile = useCallback((parentId: string | null) => {
    const name = window.prompt("Name this file");
    const trimmed = name?.trim();
    if (!trimmed) {
      return;
    }
    const id = createNodeId("file");
    setCustomTree((prev) => addCustomNode(prev, parentId, { type: "file", id, name: trimmed }));
    if (parentId) {
      setExpandedFolders((prev) => (prev.includes(parentId) ? prev : [...prev, parentId]));
    }
  }, []);

  return (
    <div className="flex h-full flex-col gap-5">
      <div
        className="flex flex-1 flex-col overflow-hidden border-none border-[var(--editor-border)]  shadow-[var(--editor-shadow)]"
      >
        <div className="flex items-center justify-between border-none border-[var(--editor-subtle-border)] px-3 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--editor-muted)]">
          <span>Workspace</span>
          <div className="flex items-center gap-1">
             <button
              type="button"
              onClick={() => handleCreateFile(null)}
              className="flex h-8 w-8 items-center justify-center border-none text-md transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              <FilePlus size={16} />
              <span className="sr-only">Create file</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateFolder(null)}
              className="flex h-8 w-8 items-center justify-center  border-none text-md transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              <FolderPlus size={16} />
              <span className="sr-only">Create folder</span>
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-1 py-3">
          <ul className="space-y-1 text-sm">
            {workspaceTree.map((node) => (
              <TreeNodeItem
                key={node.id}
                node={node}
                depth={0}
                accentColor={accentColor}
                expandedFolders={expandedFolders}
                activeSlug={activeSlug}
                onToggle={handleToggleFolder}
                onCreateFolder={handleCreateFolder}
                onCreateFile={handleCreateFile}
              />
            ))}
          </ul>
        </nav>
      </div>
      <div className="">
        <label className="sr-only" htmlFor="draft-search">
          Search drafts
        </label>
        <input
          id="draft-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search drafts"
          className="w-full border border-dashed border-[var(--editor-border)] bg-transparent px-2 py-2 text-sm text-[color:var(--editor-page-text)] placeholder:text-[color:var(--editor-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
          type="search"
        />
      </div>
    </div>
  );
}
