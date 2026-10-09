"use client";

import { useCallback, useMemo, useState } from "react";
import { DataTable, type Column } from "@/components/DataTable";
import { Panel, PanelHeader } from "@/components/ui/Panel";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { actions, rowKey, type useDerivedState } from "@/lib/store";
import { usePrefs } from "@/lib/store";
import { formatClock, formatRelative, statusTone, typeTone } from "@/lib/utils";
import type { PendingEvent } from "@/lib/api";

type Derived = ReturnType<typeof useDerivedState>;

export default function QueueView({
  state,
  notify,
}: {
  state: Derived;
  notify: (message: string, tone: "success" | "error" | "info") => void;
}) {
  const { data, selected, isRefreshing, connection } = state;
  const { prefs, update } = usePrefs();
  const [busy, setBusy] = useState(false);

  const pending = useMemo(() => data.pending, [data.pending]);

  const columns = useMemo<Array<Column<PendingEvent>>>(
    () => [
      {
        key: "event_id",
        header: "Event ID",
        width: "22%",
        accessor: (row) => row.event_id,
        render: (row) => (
          <span className="font-mono text-[13px] text-slate-100">{row.event_id}</span>
        ),
      },
      {
        key: "source_id",
        header: "Source",
        width: "16%",
        accessor: (row) => row.source_id,
        render: (row) => (
          <span className="truncate text-[13px] text-slate-300">{row.source_id}</span>
        ),
      },
      {
        key: "type",
        header: "Type",
        width: "10%",
        accessor: (row) => row.type,
        render: (row) => <Badge tone={typeTone(row.type)}>{row.type}</Badge>,
      },
      {
        key: "quantity",
        header: "Qty",
        align: "right",
        width: "8%",
        accessor: (row) => row.quantity ?? null,
        render: (row) =>
          row.quantity === null || row.quantity === undefined ? (
            <span className="text-slate-600">—</span>
          ) : (
            <span className="font-mono text-[13px] text-slate-200">{row.quantity}</span>
          ),
      },
      {
        key: "target",
        header: "Targets",
        width: "18%",
        hideOnSm: true,
        accessor: (row) => row.target_event_id ?? "",
        render: (row) =>
          row.target_event_id ? (
            <span className="truncate font-mono text-[12px] text-slate-400">
              {row.target_event_id}
            </span>
          ) : (
            <span className="text-slate-600">—</span>
          ),
      },
      {
        key: "status",
        header: "Status",
        width: "12%",
        accessor: (row) => row.status,
        render: (row) => <Badge tone={statusTone(row.status)} dot>{row.status}</Badge>,
      },
      {
        key: "event_time",
        header: "Received",
        align: "right",
        width: "14%",
        hideOnSm: true,
        accessor: (row) => new Date(row.event_time).getTime() || 0,
        render: (row) => (
          <span className="font-mono text-[12px] text-slate-400" title={formatClock(row.event_time)}>
            {formatRelative(row.event_time)}
          </span>
        ),
      },
    ],
    [],
  );

  const searchKeys = useMemo(
    () => [
      (row: PendingEvent) => row.event_id,
      (row: PendingEvent) => row.source_id,
      (row: PendingEvent) => row.type,
      (row: PendingEvent) => row.status,
      (row: PendingEvent) => row.target_event_id ?? "",
    ],
    [],
  );

  const runAck = useCallback(
    async (keys: string[]) => {
      const targets = keys.length
        ? keys
        : pending.filter((row) => row.type === "VOID").map(rowKey);

      if (targets.length === 0) {
        notify("Select at least one event to acknowledge", "info");
        return;
      }

      setBusy(true);
      const result = await actions.acknowledge(targets);
      setBusy(false);
      notify(result.message, result.ok ? "success" : "error");
    },
    [pending, notify],
  );

  const selectedCount = selected.size;
  const allKeys = useMemo(() => pending.map(rowKey), [pending]);

  return (
    <Panel>
      <PanelHeader
        title="Acknowledgement queue"
        subtitle="VOID events stay pending until their target COUNT is ingested"
        icon={
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        }
        actions={
          <>
            {selectedCount > 0 ? (
              <>
                <span className="font-mono text-[12px] text-neon-300">{selectedCount} selected</span>
                <button
                  type="button"
                  onClick={actions.clearSelection}
                  className="rounded-lg bg-white/6 px-3 py-1.5 text-[12px] text-slate-300 transition-colors hover:bg-white/10"
                >
                  Clear
                </button>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => runAck([])}
              disabled={busy || connection === "offline"}
              className="rounded-xl bg-neon-400/12 px-3.5 py-1.5 text-[12.5px] font-medium text-neon-300 ring-1 ring-neon-400/25 transition-colors hover:bg-neon-400/20 disabled:pointer-events-none disabled:opacity-40"
            >
              {busy ? "Working…" : "Acknowledge pending VOIDs"}
            </button>
          </>
        }
      />

      <DataTable
        rows={pending}
        columns={columns}
        getKey={rowKey}
        isLoading={isRefreshing && pending.length === 0}
        renderSkeleton={<TableSkeleton rows={7} cols={6} />}
        emptyTitle="Acknowledgement queue is empty"
        emptyDescription="No event is waiting for a reference. New pending events appear here automatically within 5 seconds."
        pageSize={prefs.pageSize}
        onPageSizeChange={(pageSize) => update({ pageSize })}
        selectable
        selected={selected}
        onToggleRow={actions.toggleSelect}
        onToggleAll={(keys) =>
          keys.length && keys.every((key) => selected.has(key))
            ? actions.setSelection(allKeys.filter((key) => !selected.has(key)))
            : actions.setSelection(allKeys)
        }
        searchKeys={searchKeys}
        rowActions={(row) => (
          <button
            type="button"
            onClick={() => runAck([rowKey(row)])}
            disabled={busy}
            className="rounded-lg bg-white/6 px-2.5 py-1 text-[11.5px] text-slate-300 transition-colors hover:bg-neon-400/15 hover:text-neon-300 disabled:opacity-40"
          >
            Ack
          </button>
        )}
      />
    </Panel>
  );
}