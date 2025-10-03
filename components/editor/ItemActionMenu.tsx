"use client";

import { useCallback, useId, useState } from "react";
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
  const confirmTitleId = useId();
  const confirmDescriptionId = useId();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRename = useCallback(() => {
    onRename?.();
  }, [onRename]);

  const handleDelete = useCallback(() => {
    if (!onDelete) {
      return;
    }
    setShowConfirm(true);
  }, [onDelete]);

  const handleCancelDelete = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!onDelete) {
      return;
    }
    onDelete();
    setShowConfirm(false);
  }, [onDelete]);

  return (
    <div className={`flex items-center gap-1 ${className ?? ""}`} aria-label={ariaLabel} role="group">
      {onRename && (
        <button
          type="button"
          onClick={handleRename}
          className="flex h-6 w-6 items-center justify-center rounded-sm text-[color:var(--editor-muted)] transition-all hover:text-yellow-400 hover:shadow-[0_0_0.75rem_rgba(250,204,21,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
          aria-label="Rename"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
      )}
      {onDelete && (
        <>
          <button
            type="button"
            onClick={handleDelete}
            className="flex h-6 w-6 items-center justify-center rounded-sm text-[color:var(--editor-muted)] transition-all hover:text-[color:var(--editor-danger, #d92c20)] hover:shadow-[0_0_0.75rem_rgba(217,44,32,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            aria-label="Delete"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
          {showConfirm && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby={confirmTitleId}
              aria-describedby={confirmDescriptionId}
              onClick={handleCancelDelete}
            >
              <div
                className="w-full max-w-sm rounded-lg border border-[var(--editor-border)] bg-[color:var(--editor-surface,#ffffff)] p-6 text-[color:var(--editor-page-text)] shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <h2 id={confirmTitleId} className="text-lg font-semibold">
                  Delete item
                </h2>
                <p id={confirmDescriptionId} className="mt-2 text-sm text-[color:var(--editor-muted)]">
                  Are you sure you want to delete this item? This action cannot be undone.
                </p>
                <div className="mt-6 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="rounded-md border border-[var(--editor-border)] px-3 py-1.5 text-sm font-medium text-[color:var(--editor-page-text)] transition-colors hover:bg-[var(--editor-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="rounded-md bg-[color:var(--editor-danger, #d92c20)] px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-[color:var(--editor-danger-strong,#b81f16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
