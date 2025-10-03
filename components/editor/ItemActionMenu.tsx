"use client";

import { useCallback } from "react";
import { Pencil, Trash2 } from "lucide-react";

type ItemActionMenuProps = {
  readonly ariaLabel: string;
  readonly className?: string;
  readonly onRename?: () => void;
  readonly onDelete?: () => void;
};

export default function ItemActionMenu({
  ariaLabel,
  className,
  onRename,
  onDelete,
}: ItemActionMenuProps) {
  const handleRename = useCallback(() => {
    onRename?.();
  }, [onRename]);

  const handleDelete = useCallback(() => {
    if (!onDelete) {
      return;
    }
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (confirmed) {
      onDelete();
    }
  }, [onDelete]);

  return (
    <div
      className={`flex items-center gap-1 ${className ?? ""}`}
      aria-label={ariaLabel}
      role="group"
    >
      {onRename && (
        <button
          type="button"
          onClick={handleRename}
          className="flex h-6 w-6 items-center justify-center rounded-sm text-[color:var(--editor-muted)] transition-colors hover:text-[var(--editor-page-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          aria-label="Rename"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={handleDelete}
          className="flex h-6 w-6 items-center justify-center rounded-sm text-[color:var(--editor-muted)] transition-colors hover:text-[color:var(--editor-danger, #d92c20)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
