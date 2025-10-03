"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ChevronDown, ChevronRight, FilePlus, Folder, FolderOpen, FolderPlus, Folders } from "lucide-react";

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
  readonly renamingFolderId: string | null;
  readonly renamingDraftId: string | null;
  readonly onSubmitFolderRename: (folderId: string, name: string) => Promise<void>;
  readonly onSubmitDraftRename: (draftId: string, name: string) => Promise<void>;
  readonly onCancelFolderRename: () => void;
  readonly onCancelDraftRename: () => void;
};

const UNFILED_FOLDER_ID = "workspace-unfiled";

const INDENT_STEP_REM = 1.25;

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
  renamingFolderId,
  renamingDraftId,
  onSubmitFolderRename,
  onSubmitDraftRename,
  onCancelFolderRename,
  onCancelDraftRename,
}: TreeNodeItemProps) {
  const indentStyle = { paddingLeft: `${Math.max(0, depth) * INDENT_STEP_REM}rem` };
  const [folderName, setFolderName] = useState(node.type === "folder" ? node.name : "");
  const [draftName, setDraftName] = useState(node.type === "draft" ? node.name : "");
  const [folderSubmitting, setFolderSubmitting] = useState(false);
  const [draftSubmitting, setDraftSubmitting] = useState(false);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const draftInputRef = useRef<HTMLInputElement | null>(null);
  const folderSubmitRef = useRef(false);
  const draftSubmitRef = useRef(false);

  useEffect(() => {
    if (node.type === "folder" && renamingFolderId !== node.id) {
      setFolderName(node.name);
    }
  }, [node, renamingFolderId]);

  useEffect(() => {
    if (node.type === "draft" && renamingDraftId !== node.id) {
      setDraftName(node.name);
    }
  }, [node, renamingDraftId]);

  useEffect(() => {
    if (node.type === "folder" && renamingFolderId === node.id) {
      const frame = requestAnimationFrame(() => {
        folderInputRef.current?.select();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [node, renamingFolderId]);

  useEffect(() => {
    if (node.type === "draft" && renamingDraftId === node.id) {
      const frame = requestAnimationFrame(() => {
        draftInputRef.current?.select();
      });
      return () => cancelAnimationFrame(frame);
    }
    return undefined;
  }, [node, renamingDraftId]);

  const commitFolderRename = useCallback(async () => {
    if (node.type !== "folder") {
      return;
    }
    if (renamingFolderId !== node.id) {
      return;
    }
    if (folderSubmitting) {
      return;
    }

    const trimmed = folderName.trim();
    if (trimmed.length === 0) {
      setFolderName(node.name);
      onCancelFolderRename();
      return;
    }

    if (trimmed === node.name) {
      onCancelFolderRename();
      return;
    }

    try {
      setFolderSubmitting(true);
      await onSubmitFolderRename(node.id, trimmed);
    } finally {
      setFolderSubmitting(false);
    }
  }, [folderName, folderSubmitting, node, onCancelFolderRename, onSubmitFolderRename, renamingFolderId]);

  const commitDraftRename = useCallback(async () => {
    if (node.type !== "draft") {
      return;
    }
    if (renamingDraftId !== node.id) {
      return;
    }
    if (draftSubmitting) {
      return;
    }

    const trimmed = draftName.trim();
    if (trimmed.length === 0) {
      setDraftName(node.name);
      onCancelDraftRename();
      return;
    }

    if (trimmed === node.name) {
      onCancelDraftRename();
      return;
    }

    try {
      setDraftSubmitting(true);
      await onSubmitDraftRename(node.id, trimmed);
    } finally {
      setDraftSubmitting(false);
    }
  }, [draftName, draftSubmitting, node, onCancelDraftRename, onSubmitDraftRename, renamingDraftId]);

  if (node.type === "folder") {
    const isExpanded = expandedFolders.includes(node.id);
    const isRenaming = renamingFolderId === node.id;

    const ToggleIcon = isExpanded ? ChevronDown : ChevronRight;
    const FolderIcon =
      node.origin === "system" ? (isExpanded ? FolderOpen : Folder) : Folders;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      folderSubmitRef.current = true;
      await commitFolderRename();
      folderSubmitRef.current = false;
    };

    const handleBlur = async () => {
      if (folderSubmitRef.current) {
        folderSubmitRef.current = false;
        return;
      }
      await commitFolderRename();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setFolderName(node.name);
        onCancelFolderRename();
      }
    };

    return (
      <li>
        <div
          className="group flex items-center justify-between rounded-md px-2 py-1 text-sm font-medium text-[color:var(--editor-muted)] transition-colors hover:bg-[var(--editor-soft)] hover:text-[color:var(--editor-page-text)]"
          style={indentStyle}
        >
          <div className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => onToggle(node.id)}
              className="flex items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              <ToggleIcon
                aria-hidden
                className="h-4 w-4 shrink-0 text-[color:var(--editor-muted)] transition-colors group-hover:text-[var(--accent)]"
              />
              <FolderIcon
                aria-hidden
                className="h-4 w-4 shrink-0 text-[color:var(--editor-muted)] transition-colors group-hover:text-[var(--accent)]"
              />
            </button>
            {isRenaming ? (
              <form onSubmit={handleSubmit} className="flex-1" spellCheck={false}>
                <input
                  ref={folderInputRef}
                  value={folderName}
                  onChange={(event) => setFolderName(event.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-sm border border-[var(--editor-border)] bg-transparent px-2 py-1 text-sm text-[color:var(--editor-page-text)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
                  aria-label="Folder name"
                  disabled={folderSubmitting}
                />
              </form>
            ) : (
              <button
                type="button"
                onClick={() => onToggle(node.id)}
                className="flex flex-1 items-center gap-2 truncate text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
              >
                <span className="truncate">{node.name}</span>
              </button>
            )}
          </div>
          {node.editable && !isRenaming && (
            <ItemActionMenu
              ariaLabel={`Folder actions for ${node.name}`}
              className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              onDelete={() => onDeleteFolder(node.id)}
              onRename={() => onRenameFolder(node.id)}
            />
          )}
        </div>
        {isExpanded && node.children.length > 0 && (
          <ul className="mt-1 space-y-1 pl-3">
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
                renamingFolderId={renamingFolderId}
                renamingDraftId={renamingDraftId}
                onSubmitFolderRename={onSubmitFolderRename}
                onSubmitDraftRename={onSubmitDraftRename}
                onCancelFolderRename={onCancelFolderRename}
                onCancelDraftRename={onCancelDraftRename}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  if (node.type === "draft") {
    const isActive = activeSlug === node.slug;
    const isRenaming = renamingDraftId === node.id;

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      draftSubmitRef.current = true;
      await commitDraftRename();
      draftSubmitRef.current = false;
    };

    const handleBlur = async () => {
      if (draftSubmitRef.current) {
        draftSubmitRef.current = false;
        return;
      }
      await commitDraftRename();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setDraftName(node.name);
        onCancelDraftRename();
      }
    };

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
          {isRenaming ? (
            <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 items-center" spellCheck={false}>
              <input
                ref={draftInputRef}
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="w-full rounded-sm border border-[var(--editor-border)] bg-transparent px-2 py-1 text-sm text-[color:var(--editor-page-text)] focus:border-[var(--accent)] focus:outline-none focus:ring-0"
                aria-label="Draft title"
                disabled={draftSubmitting}
              />
            </form>
          ) : (
            <Link
              href={`/write/${node.slug}`}
              className="flex min-w-0 flex-1 items-center"
              title={formatUpdatedAt(node.updatedAt)}
            >
              <span
                className="truncate group-hover:text-[var(--accent)]"
                style={isActive ? { color: accentColor } : undefined}
              >
                {node.name}
              </span>
            </Link>
          )}
          {node.editable && !isRenaming && (
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
  const router = useRouter();
  const { accentColor } = useEditorTheme();
  const [drafts, setDrafts] = useState<readonly DraftSummary[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<readonly string[]>([UNFILED_FOLDER_ID]);
  const [folders, setFolders] = useState<readonly FolderSummary[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(true);
  const [foldersError, setFoldersError] = useState<string | null>(null);
  const [canManageWorkspace, setCanManageWorkspace] = useState(false);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renamingDraftId, setRenamingDraftId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!active) return;
        const user = auth.user;
        if (!user) {
          setCanManageWorkspace(false);
          return;
        }

        const { data, error } = await supabase
          .from("blog_owner")
          .select("owner_id")
          .eq("owner_id", user.id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          setCanManageWorkspace(false);
        } else {
          setCanManageWorkspace(Boolean(data));
        }
      } catch (error) {
        if (!active) return;
        console.error("Unable to verify workspace permissions", error);
        setCanManageWorkspace(false);
      } finally {
        if (!active) return;
        setCheckingOwner(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [supabase]);

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
        editable: canManageWorkspace,
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
        editable: canManageWorkspace,
        children,
      } satisfies FolderTreeNode;
    });

    return [...nodes, ...folderNodes];
  }, [canManageWorkspace, filteredDrafts, folders, foldersError, foldersLoading, loading, query]);

  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((id) => id !== folderId) : [...prev, folderId],
    );
  }, []);

  const handleStartRenameFolder = useCallback((folderId: string) => {
    setRenamingDraftId(null);
    setRenamingFolderId(folderId);
  }, []);

  const handleSubmitFolderRename = useCallback(
    async (folderId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        window.alert("Folder name cannot be empty.");
        return;
      }

      const existing = folders.find((folder) => folder.id === folderId);
      if (existing && existing.name === trimmed) {
        setRenamingFolderId(null);
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
      setRenamingFolderId(null);
    },
    [folders, supabase],
  );

  const handleCancelFolderRename = useCallback(() => {
    setRenamingFolderId(null);
  }, []);

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
      setRenamingFolderId((prev) => (prev === folderId ? null : prev));
    },
    [supabase],
  );

  const handleStartRenameDraft = useCallback((draftId: string) => {
    setRenamingFolderId(null);
    setRenamingDraftId(draftId);
  }, []);

  const handleSubmitDraftRename = useCallback(
    async (draftId: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) {
        window.alert("Draft title cannot be empty.");
        return;
      }

      const existing = drafts.find((draft) => draft.id === draftId);
      if (existing && (existing.title ?? "").trim() === trimmed) {
        setRenamingDraftId(null);
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
      setRenamingDraftId(null);
    },
    [drafts, supabase],
  );

  const handleCancelDraftRename = useCallback(() => {
    setRenamingDraftId(null);
  }, []);

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
      setRenamingDraftId((prev) => (prev === draftId ? null : prev));
    },
    [supabase],
  );

  const handleCreateFolder = useCallback(async () => {
    if (!canManageWorkspace) {
      return;
    }

    const name = window.prompt("Folder name");
    const trimmed = name?.trim();
    if (!trimmed) {
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      window.alert("Sign in to create folders.");
      return;
    }

    const slugBase = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-{2,}/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${slugBase || "folder"}-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await supabase
      .from("folders")
      .insert({
        owner_id: user.id,
        name: trimmed,
        slug,
      })
      .select("id,name")
      .single();

    if (error) {
      window.alert(`Unable to create folder: ${error.message}`);
      return;
    }

    if (!data) {
      return;
    }

    const insertedFolder: FolderSummary = { id: data.id, name: data.name };

    setFolders((prev) =>
      [...prev, insertedFolder].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    );
    setExpandedFolders((prev) => (prev.includes(insertedFolder.id) ? prev : [...prev, insertedFolder.id]));
    setRenamingDraftId(null);
    setRenamingFolderId(insertedFolder.id);
  }, [canManageWorkspace, supabase]);

  const handleCreateDraft = useCallback(async () => {
    if (!canManageWorkspace) {
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) {
      window.alert("Sign in to create drafts.");
      return;
    }

    const title = "Untitled";
    const slug = `untitled-${Math.random().toString(36).slice(2, 8)}`;

    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: user.id,
        title,
        slug,
        status: "draft",
        content_json: { type: "doc", content: [{ type: "paragraph" }] },
      })
      .select("id,title,slug,updated_at,folder_id")
      .single();

    if (error) {
      window.alert(`Unable to create draft: ${error.message}`);
      return;
    }

    if (!data) {
      return;
    }

    const newDraft: DraftSummary = {
      id: data.id,
      title: data.title,
      slug: data.slug,
      updated_at: data.updated_at,
      folder_id: data.folder_id,
    };

    setDrafts((prev) => [newDraft, ...prev]);
    router.push(`/write/${data.slug}`);
  }, [canManageWorkspace, router, supabase]);

  return (
    <div className="flex h-full flex-col gap-5">
      <div
        className="flex flex-1 flex-col overflow-hidden border-none border-[var(--editor-border)]  shadow-[var(--editor-shadow)]"
      >
        <div className="flex items-center justify-between border-none border-[var(--editor-subtle-border)] px-3 py-3 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-[color:var(--editor-muted)] transition-colors hover:bg-[var(--editor-soft)] hover:text-[color:var(--editor-page-text)]">
          <span>Workspace</span>
          {canManageWorkspace && !checkingOwner && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCreateFolder}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-dashed border-[var(--editor-border)] text-[color:var(--editor-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
                title="New folder"
                aria-label="Create new folder"
              >
                <FolderPlus className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={handleCreateDraft}
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-dashed border-[var(--editor-border)] text-[color:var(--editor-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
                title="New draft"
                aria-label="Create new draft"
              >
                <FilePlus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
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
                  onRenameFolder={handleStartRenameFolder}
                  onDeleteFolder={handleDeleteFolder}
                  onRenameDraft={handleStartRenameDraft}
                  onDeleteDraft={handleDeleteDraft}
                  renamingFolderId={renamingFolderId}
                  renamingDraftId={renamingDraftId}
                  onSubmitFolderRename={handleSubmitFolderRename}
                  onSubmitDraftRename={handleSubmitDraftRename}
                  onCancelFolderRename={handleCancelFolderRename}
                  onCancelDraftRename={handleCancelDraftRename}
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
