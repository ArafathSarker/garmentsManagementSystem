"use client";

import { useEffect, useState } from "react";
import { Logo } from "./Sidebar";
import { cx, formatDuration } from "@/lib/utils";
import type { ConnectionState } from "@/lib/store";

export function Topbar({
  connection,
  latency,
  lastSync,
  paused,
  isRefreshing,
  sourceFilter,
  onSourceFilterChange,
  onRefresh,
  onTogglePause,
  onOpenSettings,
}: {
  connection: ConnectionState;
  latency: number | null;
  lastSync: number | null;
  paused: boolean;
  isRefreshing: boolean;
  sourceFilter: string | null;
  onSourceFilterChange: (sourceId: string | null) => void;
  onRefresh: () => void;
  onTogglePause: () => void;
  onOpenSettings: () => void;
}) {
  const elapsed = useElapsed(lastSync);
  const [localFilter, setLocalFilter] = useState(sourceFilter || "");

  // Update local input if remote changes
  useEffect(() => {
    setLocalFilter(sourceFilter || "");
  }, [sourceFilter]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-ink-950/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <span className="lg:hidden">
          <Logo size={32} />
        </span>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-sm font-semibold tracking-tight text-white sm:text-[15px]">
            Garment Line Control
            <span className="ml-2 hidden font-mono text-[11px] text-slate-500 sm:inline">
              fse01 · production ingest
            </span>
          </h1>
        </div>

        <div className="hidden items-center gap-2 rounded-full bg-white/4 px-3 py-1.5 ring-1 ring-white/8 md:flex">
          <LatencyDots latency={latency} />
          <span className="font-mono text-[11px] text-slate-300">
            {latency === null ? "—" : `${latency}ms`}
          </span>
          <span className="h-3 w-px bg-white/10" />
          <span className="font-mono text-[11px] text-slate-400">{formatDuration(elapsed)}</span>
        </div>

        <div className="mr-2 flex items-center">
          <input
            type="text"
            placeholder="Filter Source ID (e.g. LINE-01)"
            value={localFilter}
            onChange={(e) => setLocalFilter(e.target.value)}
            onBlur={() => onSourceFilterChange(localFilter.trim() || null)}
            onKeyDown={(e) => e.key === "Enter" && onSourceFilterChange(localFilter.trim() || null)}
            className="w-48 rounded-xl bg-white/4 px-3 py-1.5 text-sm text-white placeholder-slate-500 outline-none ring-1 ring-white/8 transition-colors focus:bg-white/8 focus:ring-white/20 sm:w-56"
          />
        </div>

        <button
          type="button"
          onClick={onTogglePause}
          aria-pressed={paused}
          title={paused ? "Resume live polling" : "Pause live polling"}
          className={cx(
            "grid size-9 place-items-center rounded-xl ring-1 transition-colors",
            paused
              ? "bg-amber-400/12 text-amber-300 ring-amber-400/25"
              : "bg-white/4 text-slate-300 ring-white/8 hover:bg-white/8",
          )}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" className="size-4">
              <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
            </svg>
          )}
        </button>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refresh now"
          className="grid size-9 place-items-center rounded-xl bg-white/4 text-slate-300 ring-1 ring-white/8 transition-colors hover:bg-white/8 disabled:opacity-50"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cx("size-4", isRefreshing && "animate-spin")}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
          </svg>
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Open settings"
          className="grid size-9 place-items-center rounded-xl bg-white/4 text-slate-300 ring-1 ring-white/8 transition-colors hover:bg-white/8 lg:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
        </button>

        <ConnectionPill connection={connection} />
      </div>
    </header>
  );
}

function ConnectionPill({ connection }: { connection: ConnectionState }) {
  const map = {
    live: { label: "Live", className: "bg-neon-400/12 text-neon-300 ring-neon-400/25" },
    offline: { label: "Offline", className: "bg-rose-500/12 text-rose-300 ring-rose-400/25" },
    connecting: {
      label: "Syncing",
      className: "bg-amber-400/12 text-amber-300 ring-amber-400/25",
    },
  } as const;

  const item = map[connection];

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset",
        item.className,
      )}
    >
      <span className="relative grid size-1.5 place-items-center">
        {connection === "live" ? (
          <span className="absolute size-2.5 animate-[var(--animate-pulse-ring)] rounded-full bg-neon-400" />
        ) : null}
        <span className="size-1.5 rounded-full bg-current" />
      </span>
      <span className="hidden sm:inline">{item.label}</span>
    </span>
  );
}

function LatencyDots({ latency }: { latency: number | null }) {
  const bars =
    latency === null
      ? [1, 1, 1]
      : latency < 80
        ? [1, 1.6, 2.4]
        : latency < 250
          ? [2.4, 1.6, 1]
          : [1, 2.4, 1];

  const tone = latency === null ? "bg-slate-600" : latency < 250 ? "bg-neon-400" : "bg-amber-400";

  return (
    <span className="flex h-3 items-end gap-[2px]" aria-hidden>
      {bars.map((height, index) => (
        <span
          key={index}
          className={cx("w-[3px] rounded-sm transition-all", tone)}
          style={{ height: `${height * 4}px` }}
        />
      ))}
    </span>
  );
}

function useElapsed(lastSync: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Ticks only while a sync has been observed, so an idle dashboard stays cheap.
    if (lastSync === null) return;
    const timer = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(timer);
  }, [lastSync]);

  return lastSync === null ? 0 : now - lastSync;
}