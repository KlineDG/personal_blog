"use client";

import { useEditorTheme } from "./EditorShell";

type SaveState = "idle" | "saving" | "saved" | "error";

type SaveIndicatorProps = {
  readonly state: SaveState;
};

export default function SaveIndicator({ state }: SaveIndicatorProps) {
  const { accentColor } = useEditorTheme();

  const text =
    state === "saving"
      ? "Saving…"
      : state === "saved"
        ? "Saved"
        : state === "error"
          ? "Error"
          : "";

  if (!text) return null;

  return (
    <span
      className="text-[10px] uppercase tracking-[0.28em] transition-colors"
      style={{
        color:
          state === "saved"
            ? accentColor
            : state === "error"
              ? "#f87171"
              : "var(--editor-muted)",
      }}
    >
      {text}
    </span>
  );
}
