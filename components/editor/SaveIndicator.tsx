"use client";

type SaveState = "idle" | "saving" | "saved" | "error";

type SaveIndicatorProps = {
  readonly state: SaveState;
};

export default function SaveIndicator({ state }: SaveIndicatorProps) {
  if (state !== "saving") return null;

  return (
    <span
      className="text-[10px] uppercase tracking-[0.28em] text-[color:var(--editor-muted)]"
    >
      Saving…
    </span>
  );
}
