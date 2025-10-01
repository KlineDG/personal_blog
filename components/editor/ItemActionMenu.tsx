"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";

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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, open]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleRename = useCallback(() => {
    close();
    onRename?.();
  }, [close, onRename]);

  const handleDelete = useCallback(() => {
    close();
    onDelete?.();
  }, [close, onDelete]);

  return (
    <div ref={containerRef} className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex h-6 w-6 items-center justify-center rounded-sm text-[color:var(--editor-muted)] transition-colors hover:text-[var(--editor-page-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <MoreVertical className="h-4 w-4" aria-hidden />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-36 rounded-md border border-[var(--editor-border)] bg-[var(--editor-page)] p-1 text-left shadow-lg">
          {onRename && (
            <button
              type="button"
              onClick={handleRename}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm text-[color:var(--editor-page-text)] transition-colors hover:bg-[var(--editor-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              Rename
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1 text-sm text-[color:var(--editor-danger, #d92c20)] transition-colors hover:bg-[var(--editor-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-0"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
