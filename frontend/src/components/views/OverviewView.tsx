"use client";

import { useMemo } from "react";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { StatCard } from "@/components/ui/StatCard";
import { DonutChart, HorizontalBars, TrendChart } from "@/components/ui/Charts";
import { StatSkeletonGrid, EmptyState } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { rowKey } from "@/lib/store";
import {
  cx,
  formatClock,
  formatNumber,
  formatRelative,
  statusTone,
  typeTone,
} from "@/lib/utils";
import type { useDerivedState } from "@/lib/store";

type Derived = ReturnType<typeof useDerivedState>;

export default function OverviewView({
  state,
  onNavigate,
}: {
  state: Derived;
  onNavigate: (view: "queue" | "exceptions") => void;
}) {
  const { data, history, connection, latency, unresolved, sources, health } = state;
  const { summary } = data;

  const isBooting = connection === "connecting" && history.length === 0;

  const recent = useMemo(() => data.pending.slice(0, 6), [data.pending]);

  const slices = useMemo(
    () => [
      { label: "Accepted", value: summary.processed_events, color: "#34e3b0" },
      { label: "Pending void", value: summary.pending_void, color: "#fbbf24" },
      { label: "Duplicates", value: summary.duplicates, color: "#38bdf8" },
      { label: "Conflicts", value: summary.conflicts, color: "#fb7185" },
    ],
    [summary],
  );

  const sourceBars = useMemo(
    () =>
      sources.slice(0, 6).map((source) => ({
        label: source.sourceId,
        value: source.pending,
        hint: `${source.voids} void event(s) queued`,
      })),
    [sources],
  );

  return (
    <div className="space-y-5">
      {isBooting ? (
        <StatSkeletonGrid />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatCard
            label="Net Total"
            value={summary.net_total}
            hint="Units across accepted counts"
            tone="neon"
            history={history}
            isLoading={isBooting}
          />
          <StatCard
            label="Processed"
            value={summary.processed_events}
            hint={`${Math.round(health.acceptanceRate * 100)}% acceptance rate`}
            tone="cyan"
            history={history.map((value) => value - summary.pending_void)}
          />
          <StatCard
            label="Pending Void"
            value={summary.pending_void}
            hint="Awaiting reference resolution"
            tone="amber"
            active
            onClick={() => onNavigate("queue")}
          />
          <StatCard
            label="Exceptions"
            value={summary.unresolved + summary.conflicts + summary.duplicates}
            hint="Requires operator review"
            tone="rose"
            active
            onClick={() => onNavigate("exceptions")}
          />
          <StatCard
            label="Rejected"
            value={summary.rejected_submissions}
            hint="Submissions explicitly rejected"
            tone="rose"
          />
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <PanelHeader
            title="Net output velocity"
            subtitle="Sampled every 5s from /api/state"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 17 9 11l4 4 7-7" />
              </svg>
            }
            actions={
              latency !== null ? (
                <Badge tone={latency < 250 ? "emerald" : "amber"}>rtt {latency}ms</Badge>
              ) : null
            }
          />
          <div className="p-5 pt-6">
            {history.length > 1 ? (
              <TrendChart series={history} label="Net total over time" />
            ) : (
              <EmptyState
                title="Collecting samples…"
                description="The velocity chart appears after two successful polls of the backend."
              />
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Classification split" subtitle="Where every inbound event landed" />
          <div className="p-5 pt-6">
            <DonutChart
              slices={slices}
              centerLabel="events"
              centerValue={formatNumber(summary.processed_events + summary.pending_void)}
            />
          </div>
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-5">
        <Panel className="xl:col-span-2">
          <PanelHeader title="Backlog by line source" subtitle="Top 6 devices by pending depth" />
          <div className="p-5 pt-6">
            {sourceBars.length ? (
              <HorizontalBars rows={sourceBars} />
            ) : (
              <EmptyState
                title="No queued events"
                description="Every source is fully reconciled right now."
              />
            )}
          </div>
        </Panel>

        <Panel className="xl:col-span-3">
          <PanelHeader
            title="Latest ingest"
            subtitle="Most recent events awaiting acknowledgement"
            actions={
              <button
                type="button"
                onClick={() => onNavigate("queue")}
                className="rounded-lg bg-white/6 px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:bg-white/10"
              >
                View queue
              </button>
            }
          />

          {recent.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              description={
                unresolved.length
                  ? `${unresolved.length} unresolved exception(s) still need review.`
                  : "All production events have been acknowledged."
              }
              action={
                unresolved.length ? (
                  <button
                    type="button"
                    onClick={() => onNavigate("exceptions")}
                    className="mt-1 rounded-xl bg-rose-400/12 px-4 py-2 text-[13px] text-rose-300 ring-1 ring-rose-400/25 transition-colors hover:bg-rose-400/20"
                  >
                    Review exceptions
                  </button>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-white/5">
              {recent.map((row) => (
                <li
                  key={rowKey(row)}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/4 sm:px-6"
                >
                  <span
                    className={cx(
                      "grid size-9 shrink-0 place-items-center rounded-xl font-mono text-[11px] font-bold",
                      row.type === "VOID"
                        ? "bg-violet-400/12 text-violet-300"
                        : "bg-sky-400/12 text-sky-300",
                    )}
                  >
                    {row.type === "VOID" ? "V" : "C"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-[13px] text-slate-200">{row.event_id}</p>
                    <p className="truncate text-[11.5px] text-slate-500">{row.source_id}</p>
                  </div>

                  <Badge tone={typeTone(row.type)}>{row.type}</Badge>
                  <Badge tone={statusTone(row.status)} dot>
                    {row.status === "ACCEPTED" ? "OK" : "Queued"}
                  </Badge>

                  <span
                    className="hidden font-mono text-[11.5px] text-slate-500 sm:block"
                    title={formatClock(row.event_time)}
                  >
                    {formatRelative(row.event_time)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}