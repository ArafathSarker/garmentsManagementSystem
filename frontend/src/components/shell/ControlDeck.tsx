"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Sidebar, MobileNav, buildNav, type ViewId } from "@/components/shell/Sidebar";
import { Topbar } from "@/components/shell/Topbar";
import { ToastViewport, useToasts } from "@/components/ui/Toast";
import { actions, useDerivedState } from "@/lib/store";

/**
 * Every view is code-split and hydrated on demand. The shell ships in the initial
 * bundle; a view's JS is only requested when the operator navigates to it.
 */
const OverviewView = dynamic(() => import("@/components/views/OverviewView"), {
  loading: () => <ViewSkeleton />,
});

const QueueView = dynamic(() => import("@/components/views/QueueView"), {
  loading: () => <ViewSkeleton />,
});

const ExceptionsView = dynamic(() => import("@/components/views/ExceptionsView"), {
  loading: () => <ViewSkeleton />,
});

const SourcesView = dynamic(() => import("@/components/views/SourcesView"), {
  loading: () => <ViewSkeleton />,
});

const SettingsView = dynamic(() => import("@/components/views/SettingsView"), {
  loading: () => <ViewSkeleton />,
});

function ViewSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <div className="skeleton h-24 rounded-3xl bg-white/5" />
      <div className="skeleton h-80 rounded-3xl bg-white/5" />
    </div>
  );
}

const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  overview: {
    title: "Production overview",
    subtitle: "Live pulse across every line source, with reconciliation health at a glance.",
  },
  queue: {
    title: "Acknowledgement queue",
    subtitle: "VOID events held until their target COUNT lands. Select and clear in bulk.",
  },
  exceptions: {
    title: "Exception ledger",
    subtitle: "Duplicates, conflicts and rejected submissions with their classification reason.",
  },
  sources: {
    title: "Line sources",
    subtitle: "Per-device backlog depth and event timeline.",
  },
  settings: {
    title: "Settings",
    subtitle: "Connection diagnostics and locally persisted preferences.",
  },
};

export default function ControlDeck() {
  const [view, setView] = useState<ViewId>("overview");
  const { toasts, push, dismiss } = useToasts();

  const state = useDerivedState();
  const { connection, latency, lastSync, paused, isRefreshing, data, selected } = state;

  const notify = useCallback(
    (message: string, tone: "success" | "error" | "info") => push(message, tone),
    [push],
  );

  const nav = useMemo(
    () =>
      buildNav({
        queue: data.pending.length,
        exceptions: state.unresolved.length,
        sources: state.sources.length,
      }),
    [data.pending.length, state.unresolved.length, state.sources.length],
  );

  const meta = VIEW_META[view];

  return (
    <div className="flex min-h-dvh bg-ink-950">
      {/* Ambient background layers */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="grid-backdrop absolute inset-0 opacity-40" />
        <div className="absolute -top-40 -left-32 size-[520px] animate-[var(--animate-drift)] rounded-full bg-violet-600/18 blur-[120px]" />
        <div
          className="absolute top-1/3 -right-40 size-[560px] animate-[var(--animate-drift)] rounded-full bg-neon-500/14 blur-[130px]"
          style={{ animationDelay: "-8s" }}
        />
        <div
          className="absolute -bottom-52 left-1/4 size-[480px] animate-[var(--animate-drift)] rounded-full bg-cyan-500/10 blur-[120px]"
          style={{ animationDelay: "-15s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_35%,var(--color-ink-950)_100%)]" />
      </div>

      <Sidebar items={nav} active={view} onSelect={setView} connection={connection} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          connection={connection}
          latency={latency}
          lastSync={lastSync}
          paused={paused}
          isRefreshing={isRefreshing}
          onRefresh={() => void actions.refresh()}
          onTogglePause={actions.togglePaused}
          onOpenSettings={() => setView("settings")}
        />

        <MobileNav items={nav} active={view} onSelect={setView} />

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <header className="mb-6">
              <h2 className="text-gradient text-2xl font-bold tracking-tight sm:text-3xl">
                {meta.title}
              </h2>
              <p className="mt-1.5 max-w-2xl text-[13.5px] text-slate-400">{meta.subtitle}</p>
            </header>

            {connection === "offline" ? (
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-500/8 px-4 py-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rose-400/20 text-[12px] text-rose-200">
                  !
                </span>
                <p className="min-w-0 flex-1 text-[13px] text-rose-100">
                  <span className="font-medium">Backend unreachable.</span> Start the Express server on
                  port 8080 — the dashboard will reconnect automatically on the next poll.
                </p>
                <button
                  type="button"
                  onClick={() => void actions.refresh()}
                  className="rounded-xl bg-rose-400/15 px-3.5 py-1.5 text-[12.5px] text-rose-100 ring-1 ring-rose-400/25 transition-colors hover:bg-rose-400/25"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {view === "overview" ? (
              <OverviewView state={state} onNavigate={setView} />
            ) : view === "queue" ? (
              <QueueView state={state} notify={notify} />
            ) : view === "exceptions" ? (
              <ExceptionsView state={state} />
            ) : view === "sources" ? (
              <SourcesView state={state} />
            ) : (
              <SettingsView state={state} />
            )}
          </div>
        </main>

        <footer className="border-t border-white/8 px-4 py-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-slate-600">
            <span>Loomline · fse01 event reconciliation</span>
            <span>
              {data.pending.length} queued · {selected.size} selected · auto-refresh 5s
            </span>
          </div>
        </footer>
      </div>

      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}