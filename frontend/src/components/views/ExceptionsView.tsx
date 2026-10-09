"use client";

import { useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { usePrefs, type useDerivedState } from "@/lib/store";
import {
  classificationTone,
  cx,
  formatClock,
  formatRelative,
} from "@/lib/utils";
import type { ExceptionRecord, Classification } from "@/lib/api";

type Derived = ReturnType<typeof useDerivedState>;

const FILTERS: Array<{ id: "all" | Classification; label: string }> = [
  { id: "all", label: "All" },
  { id: "PENDING_REFERENCE", label: "Pending" },
  { id: "DUPLICATE", label: "Duplicates" },
  { id: "CONFLICT", label: "Conflicts" },
  { id: "REJECTED", label: "Rejected" },
  { id: "ACCEPTED", label: "Accepted" },
];

export default function ExceptionsView({ state }: { state: Derived }) {
  const { data, isRefreshing } = state;
  const { prefs, update } = usePrefs();
  const [filter, setFilter] = useState<"all" | Classification>("all");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    data.exceptions.forEach((row) => {
      map.set(row.classification, (map.get(row.classification) ?? 0) + 1);
    });
    return map;
  }, [data.exceptions]);

  const rows = useMemo(
    () =>
      filter === "all"
        ? data.exceptions
        : data.exceptions.filter((row) => row.classification === filter),
    [data.exceptions, filter],
  );

  const columns = useMemo<Array<Column<ExceptionRecord>>>(
    () => [
      {
        key: "classification",
        header: "Classification",
        width: "18%",
        accessor: (row) => row.classification,
        render: (row) => (
          <Badge tone={classificationTone(row.classification)} dot>
            {row.classification.replace(/_/g, " ")}
          </Badge>
        ),
      },
      {
        key: "event_id",
        header: "Event",
        width: "20%",
        accessor: (row) => row.event_id ?? "",
        render: (row) =>
          row.event_id ? (
            <span className="font-mono text-[12.5px] text-slate-200">{row.event_id}</span>
          ) : (
            <span className="text-slate-600">—</span>
          ),
      },
      {
        key: "source_id",
        header: "Source",
        width: "16%",
        accessor: (row) => row.source_id ?? "",
        render: (row) => (
          <span className="truncate text-[12.5px] text-slate-300">{row.source_id ?? "—"}</span>
        ),
      },
      {
        key: "reason",
        header: "Reason",
        width: "30%",
        hideOnSm: true,
        accessor: (row) => row.reason ?? "",
        render: (row) =>
          row.reason ? (
            <span className="line-clamp-2 text-[12.5px] leading-snug text-slate-400">
              {row.reason}
            </span>
          ) : (
            <span className="text-slate-600">No reason supplied</span>
          ),
      },
      {
        key: "received_at",
        header: "Received",
        align: "right",
        width: "16%",
        hideOnSm: true,
        accessor: (row) => new Date(row.received_at ?? 0).getTime() || 0,
        render: (row) => (
          <span
            className="font-mono text-[12px] text-slate-400"
            title={formatClock(row.received_at)}
          >
            {formatRelative(row.received_at)}
          </span>
        ),
      },
    ],
    [],
  );

  const searchKeys = useMemo(
    () => [
      (row: ExceptionRecord) => row.event_id ?? "",
      (row: ExceptionRecord) => row.source_id ?? "",
      (row: ExceptionRecord) => row.classification,
      (row: ExceptionRecord) => row.reason ?? "",
    ],
    [],
  );

  return (
    <Panel>
      <PanelHeader
        title="Exception ledger"
        subtitle="Every rejected, duplicate or conflicting submission attempt"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
          </svg>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-white/8 px-5 py-3 sm:px-6">
        {FILTERS.map((entry) => {
          const count = entry.id === "all" ? data.exceptions.length : (counts.get(entry.id) ?? 0);
          const isActive = filter === entry.id;

          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setFilter(entry.id)}
              aria-pressed={isActive}
              className={cx(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] transition-colors",
                isActive
                  ? "bg-neon-400/15 text-neon-300 ring-1 ring-neon-400/25"
                  : "bg-white/4 text-slate-400 hover:bg-white/8 hover:text-slate-200",
              )}
            >
              {entry.label}
              <span className="font-mono text-[11px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        getKey={(row) => row.id}
        isLoading={isRefreshing && data.exceptions.length === 0}
        renderSkeleton={<TableSkeleton rows={6} cols={5} />}
        emptyTitle={
          filter === "all" ? "No exceptions recorded" : `No ${filter.replace(/_/g, " ").toLowerCase()} exceptions`
        }
        emptyDescription="Submission attempts are classified on ingest; anything that fails reconciliation lands here with its reason attached."
        pageSize={prefs.pageSize}
        onPageSizeChange={(pageSize) => update({ pageSize })}
        searchKeys={searchKeys}
      />
    </Panel>
  );
}