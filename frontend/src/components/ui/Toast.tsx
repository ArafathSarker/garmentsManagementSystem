"use client";

import { useCallback, useRef, useState } from "react";
import { cx } from "@/lib/utils";

export interface Toast {
  id: number;
  message: string;
  tone: "success" | "error" | "info";
}

export function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-2"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const tone = {
    success: "border-neon-400/30 bg-ink-850/95 text-neon-200",
    error: "border-rose-400/30 bg-ink-850/95 text-rose-200",
    info: "border-white/12 bg-ink-850/95 text-slate-200",
  }[toast.tone];

  return (
    <div
      className={cx(
        "pointer-events-auto flex items-center gap-3 rounded-2xl border px-4 py-3 text-[13px] shadow-2xl shadow-black/60 backdrop-blur-xl animate-[var(--animate-rise)]",
        tone,
      )}
    >
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/10 text-[11px]">
        {toast.tone === "success" ? "✓" : toast.tone === "error" ? "!" : "i"}
      </span>
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
        className="text-slate-500 transition-colors hover:text-slate-200"
      >
        ✕
      </button>
    </div>
  );
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Toast["tone"] = "info") => {
      const id = nextId.current++;
      setToasts((current) => [...current.slice(-3), { id, message, tone }]);
      setTimeout(() => dismiss(id), 4_200);
    },
    [dismiss],
  );

  return { toasts, push, dismiss };
}