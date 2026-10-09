"use client";

import { useMemo, useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import type { useDerivedState } from "@/lib/store";
import { cx, formatNumber, formatRelative, initials } from "@/lib/utils";

type Derived = ReturnType<typeof useDerivedState>;

export default function SourcesView({ state }: { state: Derived }) {
  const { sources, data, connection } = state;
  const [active, setActive] = useState<string | null>(null);

  const maxPending = Math.max(...sources.map((source) => source.pending), 1);

  const detail = useMemo(
    () =>
      active
        ? data.pending
            .filter((row) => row.source_id === active)
            .sort((a, b) => new Date(a.event_time).getTime() - new Date(b.event_time).getTime())
        : [],
    [active, data.pending],
  );

  if (sources.length === 0) {
    return (
      <Panel>
        <PanelHeader title="Line sources" subtitle="MQTT devices publishing production events" />
        <EmptyState
          title="No device activity detected"
          description={
            connection === "offline"
              ? "The backend is unreachable, so no source rollup can be computed. Start the API on port 8080 to populate this view."
              : "Sources appear here as soon as events arrive from the MQTT simulator."
          }
        />
      </Panel>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      <Panel className="xl:col-span-2">
        <PanelHeader
          title="Line sources"
          subtitle={`${sources.length} device(s) with pending work`}
        />

        <ul className="max-h-[560px] divide-y divide-white/5 overflow-y-auto">
          {sources.map((source) => {
            const isActive = source.sourceId === active;

            return (
              <li key={source.sourceId}>
                <button
                  type="button"
                  onClick={() => setActive(isActive ? null : source.sourceId)}
                  className={cx(
                    "flex w-full items-center gap-3.5 px-5 py-3.5 text-left transition-colors sm:px-6",
                    isActive ? "bg-neon-400/8" : "hover:bg-white/4",
                  )}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-white/12 to-white/4 font-mono text-[12px] font-bold text-slate-200 ring-1 ring-white/10">
                    {initials(source.sourceId)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-medium text-slate-100">
                      {source.sourceId}
                    </span>
                    <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-white/8">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-neon-400 to-cyan-300 transition-[width] duration-500"
                        style={{ width: `${(source.pending / maxPending) * 100}%` }}
                      />
                    </span>
                  </span>

                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-sm text-slate-200">
                      {source.pending}
                    </span>
                    <span className="block text-[10.5px] text-slate-500">queued</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel className="xl:col-span-3">
        <PanelHeader
          title={active ? `Timeline · ${active}` : "Select a source"}
          subtitle={
            active
              ? `${detail.length} event(s) awaiting acknowledgement`
              : "Pick a line source on the left to inspect its backlog"
          }
          actions={
            active ? (
              <>
                <Badge tone="amber">{sources.find((s) => s.sourceId === active)?.voids ?? 0} voids</Badge>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-lg bg-white/6 px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:bg-white/10"
                >
                  Close
                </button>
              </>
            ) : null
          }
        />

        {!active ? (
          <EmptyState
            title="No source selected"
            description="Each card shows the backlog depth per MQTT device, letting you spot a stalled line before it becomes an exception."
          />
        ) : detail.length === 0 ? (
          <EmptyState title="Backlog cleared" description="This source has no pending events." />
        ) : (
          <div className="relative p-5 sm:p-6">
            <ol className="relative ml-2 border-l border-white/10 pl-6">
              {detail.map((row, index) => (
                <li key={`${row.source_id}-${row.event_id}`} className="relative pb-5 last:pb-0">
                  <span className="absolute top-1.5 -left-[1.9rem] size-2.5 rounded-full bg-neon-400 ring-4 ring-neon-400/15" />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12.5px] text-slate-100">{row.event_id}</span>
                    <Badge tone={row.type === "VOID" ? "violet" : "sky"}>{row.type}</Badge>
                    {typeof row.quantity === "number" ? (
                      <span className="font-mono text-[12px] text-slate-400">
                        qty {formatNumber(row.quantity)}
                      </span>
                    ) : null}
                    <span className="ml-auto font-mono text-[11.5px] text-slate-500">
                      {formatRelative(row.event_time)}
                    </span>
                  </div>
                  {row.target_event_id ? (
                    <p className="mt-1 text-[12px] text-slate-500">
                      references <span className="font-mono text-slate-400">{row.target_event_id}</span>
                    </p>
                  ) : null}
                  {index === detail.length - 1 ? null : (
                    <span className="mt-3 block h-px w-full bg-gradient-to-r from-white/10 to-transparent" />
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}
      </Panel>
    </div>
  );
}