"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import { useEditorTheme } from "./EditorShell";
import ItemActionMenu from "./ItemActionMenu";

type DraftSummary = {
  readonly id: string;
  readonly title: string | null;
  readonly slug: string;
  readonly updated_at: string | null;
  readonly folder_id: string | null;
};

type DraftEventDetail = {
  readonly id: string;
  readonly title?: string;
  readonly slug?: string;
  readonly folder_id?: string | null;
};

type FolderSummary = {
  readonly id: string;
  readonly name: string;
};

type DraftTreeNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "draft";
  readonly slug: string;
  readonly updatedAt: string | null;
  readonly editable: boolean;
};

type FolderTreeNode = {
  readonly id: string;
  readonly name: string;
  readonly type: "folder";
  readonly origin: "system" | "remote";
  readonly editable: boolean;
  readonly children: readonly TreeNode[];
};

type MessageTreeNode = {
  readonly id: string;
  readonly message: string;
  readonly type: "message";
};

type TreeNode = DraftTreeNode | FolderTreeNode | MessageTreeNode;

type TreeNodeItemProps = {
  readonly node: TreeNode;
  readonly depth: number;
  readonly accentColor: string;
  readonly expandedFolders: readonly string[];
  readonly activeSlug: string | null;
  readonly onToggle: (folderId: string) => void;
  readonly onRenameFolder: (folderId: string) => void;
  readonly onDeleteFolder: (folderId: string) => void;
  readonly onRenameDraft: (draftId: string) => void;
  readonly onDeleteDraft: (draftId: string) => void;
};

const UNFILED_FOLDER_ID = "workspace-unfiled";

const toTitle = (title: string | null) => (title && title.trim().length > 0 ? title : "Untitled draft");

const formatUpdatedAt = (updatedAt: string | null) =>
  updatedAt ? new Date(updatedAt).toLocaleString() : "Never saved";

function TreeNodeItem({
  node,
  depth,
  accentColor,
  expandedFolders,
  activeSlug,
  onToggle,
  onRenameFolder,
  onDeleteFolder,
  onRenameDraft,
  onDeleteDraft,
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
          {node.editable && (
            <ItemActionMenu
              ariaLabel={`Folder actions for ${node.name}`}
              className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              onDelete={() => onDeleteFolder(node.id)}
              onRename={() => onRenameFolder(node.id)}
            />
          )}
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
                onRenameFolder={onRenameFolder}
                onDeleteFolder={onDeleteFolder}
                onRenameDraft={onRenameDraft}
                onDeleteDraft={onDeleteDraft}
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
        <div
          className="group flex items-center justify-between gap-2 rounded-md px-2 py-1 text-sm transition-colors hover:bg-[var(--editor-soft)]"
          style={{
            ...indentStyle,
            color: isActive ? accentColor : "var(--editor-page-text)",
            backgroundColor: isActive ? "var(--editor-soft)" : undefined,
          }}
        >
          <Link
            href={`/write/${node.slug}`}
            className="flex min-w-0 flex-1 items-center gap-2"
            title={formatUpdatedAt(node.updatedAt)}
          >
            <span aria-hidden className="text-base">📄</span>
            <span className="truncate group-hover:text-[var(--accent)]" style={isActive ? { color: accentColor } : undefined}>
              {node.name}
            </span>
          </Link>
          {node.editable && (
            <ItemActionMenu
              ariaLabel={`Draft actions for ${node.name}`}
              className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              onDelete={() => onDeleteDraft(node.id)}
              onRename={() => onRenameDraft(node.id)}
            />
          )}
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
  const [expandedFolders, setExpandedFolders] = useState<readonly string[]>([UNFILED_FOLDER_ID]);
  const [folders, setFolders] = useState<readonly FolderSummary[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState<string | null>(null);

  const fetchDrafts = useMemo(
    () =>
      async () => {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id,title,slug,updated_at,folder_id")
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

  const fetchFolders = useMemo(
    () =>
      async () => {
        setFoldersLoading(true);
        setFoldersError(null);
        const { data, error } = await supabase
          .from("folders")
          .select("id,name")
          .order("name", { ascending: true });
        if (error) {
          setFoldersError(error.message);
          setFolders([]);
        } else {
          setFolders(data ?? []);
        }
        setFoldersLoading(false);
      },
    [supabase],
  );

  useEffect(() => {
    fetchDrafts();
    fetchFolders();
  }, [fetchDrafts, fetchFolders]);

  useEffect(() => {
    const onRefresh = () => fetchDrafts();
    const onDraftUpdated: EventListener = (event) => {
      const detail = (event as CustomEvent<DraftEventDetail>).detail;
      if (!detail) return;
      setDrafts((prev) => prev.map((draft) => (draft.id === detail.id ? { ...draft, ...detail } : draft)));
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
    if (loading) {
      return [{ id: "drafts-loading", type: "message" as const, message: "Loading drafts…" }];
    }

    if (filteredDrafts.length === 0) {
      return [
        {
          id: "workspace-empty",
          type: "message" as const,
          message:
            query.trim().length > 0
              ? "No drafts match your search."
              : "No drafts yet. Start something new.",
        },
      ];
    }

    const draftNodesByFolder = filteredDrafts.reduce((acc, draft) => {
      const folderId = draft.folder_id ?? null;
      const list = acc.get(folderId) ?? [];
      list.push({
        id: draft.id,
        name: toTitle(draft.title),
        type: "draft" as const,
        slug: draft.slug,
        updatedAt: draft.updated_at,
        editable: true,
      });
      acc.set(folderId, list);
      return acc;
    }, new Map<string | null, DraftTreeNode[]>());

    const nodes: TreeNode[] = [];

    if (foldersError) {
      nodes.push({
        id: "folders-error",
        type: "message" as const,
        message: "Unable to load folders. Showing drafts without folders.",
      });
    }

    const unfiledDrafts = draftNodesByFolder.get(null) ?? [];
    if (unfiledDrafts.length > 0) {
      nodes.push({
        id: UNFILED_FOLDER_ID,
        name: "Unfiled",
        type: "folder" as const,
        origin: "system" as const,
        editable: false,
        children: unfiledDrafts,
      });
    }

    if (!foldersLoading && folders.length === 0) {
      return nodes.length > 0
        ? nodes
        : [
            {
              id: "workspace-no-folders",
              type: "message" as const,
              message: "No folders yet. Create one from Supabase to get started.",
            },
          ];
    }

    const folderNodes = folders.map((folder) => {
      const folderDrafts = draftNodesByFolder.get(folder.id) ?? [];
      const children: readonly TreeNode[] =
        folderDrafts.length > 0
          ? folderDrafts
          : [
              {
                id: `${folder.id}-empty`,
                type: "message" as const,
                message: "No drafts in this folder.",
              },
            ];

      return {
        id: folder.id,
        name: folder.name,
        type: "folder" as const,
        origin: "remote" as const,
        editable: true,
        children,
      } satisfies FolderTreeNode;
    });

    return [...nodes, ...folderNodes];
  }, [filteredDrafts, folders, foldersError, foldersLoading, loading, query]);

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
    );
  }, []);

  const handleRenameFolder = useCallback(
    async (folderId: string) => {
      const newName = window.prompt("Rename folder");
      const trimmed = newName?.trim();
      if (!trimmed) {
        return;
      }

      const { data, error } = await supabase
        .from("folders")
        .update({ name: trimmed })
        .eq("id", folderId)
        .select("id,name")
        .single();

      if (error) {
        window.alert(`Unable to rename folder: ${error.message}`);
        return;
      }

      if (data) {
        setFolders((prev) => prev.map((folder) => (folder.id === data.id ? { ...folder, name: data.name } : folder)));
      }
    },
    [supabase],
  );

  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      const confirmed = window.confirm("Delete this folder? Drafts will be moved to Unfiled.");
      if (!confirmed) {
        return;
      }

      const { error } = await supabase.from("folders").delete().eq("id", folderId);
      if (error) {
        window.alert(`Unable to delete folder: ${error.message}`);
        return;
      }

      setFolders((prev) => prev.filter((folder) => folder.id !== folderId));
      setDrafts((prev) =>
        prev.map((draft) => (draft.folder_id === folderId ? { ...draft, folder_id: null } : draft)),
      );
      setExpandedFolders((prev) => prev.filter((id) => id !== folderId));
    },
    [supabase],
  );

  const handleRenameDraft = useCallback(
    async (draftId: string) => {
      const newTitle = window.prompt("Rename draft");
      const trimmed = newTitle?.trim();
      if (!trimmed) {
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .update({ title: trimmed })
        .eq("id", draftId)
        .select("id,title,slug,updated_at,folder_id")
        .single();

      if (error) {
        window.alert(`Unable to rename draft: ${error.message}`);
        return;
      }

      if (data) {
        setDrafts((prev) => prev.map((draft) => (draft.id === data.id ? data : draft)));
      }
    },
    [supabase],
  );

  const handleDeleteDraft = useCallback(
    async (draftId: string) => {
      const confirmed = window.confirm("Delete this draft?");
      if (!confirmed) {
        return;
      }

      const { error } = await supabase
        .from("posts")
        .update({ is_deleted: true })
        .eq("id", draftId);

      if (error) {
        window.alert(`Unable to delete draft: ${error.message}`);
        return;
      }

      setDrafts((prev) => prev.filter((draft) => draft.id !== draftId));
    },
    [supabase],
  );

  return (
    <div className="flex h-full flex-col gap-5">
      <div
        className="flex flex-1 flex-col overflow-hidden border-none border-[var(--editor-border)]  shadow-[var(--editor-shadow)]"
      >
        <div className="flex items-center justify-between border-none border-[var(--editor-subtle-border)] px-3 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--editor-muted)] transition-colors hover:bg-[var(--editor-soft)] hover:text-[color:var(--editor-page-text)]">
          <span>Workspace</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-1 py-3">
          <ul className="space-y-1 text-sm">
            {foldersLoading && folders.length === 0 ? (
              <li>
                <div className="px-2 py-1 text-[0.8rem] text-[color:var(--editor-muted)]">Loading folders…</div>
              </li>
            ) : (
              workspaceTree.map((node) => (
                <TreeNodeItem
                  key={node.id}
                  node={node}
                  depth={0}
                  accentColor={accentColor}
                  expandedFolders={expandedFolders}
                  activeSlug={activeSlug}
                  onToggle={handleToggleFolder}
                  onRenameFolder={handleRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameDraft={handleRenameDraft}
                  onDeleteDraft={handleDeleteDraft}
                />
              ))
            )}
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
