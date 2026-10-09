"use client";

import { Panel, PanelHeader } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { actions, usePrefs, type useDerivedState } from "@/lib/store";
import { API_BASE_URL } from "@/lib/api";
import { cx } from "@/lib/utils";

type Derived = ReturnType<typeof useDerivedState>;

const POLL_OPTIONS = [
  { label: "Realtime", value: 0 },
  { label: "5s", value: 5_000 },
  { label: "15s", value: 15_000 },
  { label: "60s", value: 60_000 },
];

export default function SettingsView({ state }: { state: Derived }) {
  const { prefs, update } = usePrefs();
  const { connection, latency, lastSync, data, paused } = state;

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel>
        <PanelHeader title="Connection" subtitle="Backend transport and health" />
        <div className="divide-y divide-white/5">
          <Row label="API base URL">
            <code className="rounded-lg bg-white/6 px-2.5 py-1 font-mono text-[12px] text-neon-300">
              {API_BASE_URL}
            </code>
          </Row>
          <Row label="Health endpoint">
            <code className="rounded-lg bg-white/6 px-2.5 py-1 font-mono text-[12px] text-slate-300">
              GET /health
            </code>
          </Row>
          <Row label="Status">
            <Badge tone={connection === "live" ? "emerald" : connection === "offline" ? "rose" : "amber"} dot>
              {connection}
            </Badge>
          </Row>
          <Row label="Round trip">
            <span className="font-mono text-[12.5px] text-slate-300">
              {latency === null ? "—" : `${latency} ms`}
            </span>
          </Row>
          <Row label="Last sync">
            <span className="font-mono text-[12.5px] text-slate-300">
              {lastSync ? new Date(lastSync).toLocaleTimeString() : "never"}
            </span>
          </Row>
          <Row label="Polling">
            <span className="font-mono text-[12.5px] text-slate-300">
              {paused ? "paused" : `${Math.round((state.pollingMs || 5000) / 1000)}s`}
            </span>
          </Row>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-white/8 px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={() => void actions.refresh()}
            className="rounded-xl bg-white/6 px-3.5 py-2 text-[12.5px] text-slate-200 transition-colors hover:bg-white/10"
          >
            Force sync
          </button>
          <button
            type="button"
            onClick={actions.togglePaused}
            className="rounded-xl bg-white/6 px-3.5 py-2 text-[12.5px] text-slate-200 transition-colors hover:bg-white/10"
          >
            {paused ? "Resume polling" : "Pause polling"}
          </button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Preferences" subtitle="Persisted to local storage" />

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <Field label="Refresh interval" hint="Realtime disables background polling">
            <div className="flex flex-wrap gap-2">
              {POLL_OPTIONS.map((option) => {
                const isActive = option.value === 0 ? paused : !paused && state.pollingMs === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => actions.setPolling(option.value)}
                    className={cx(
                      "rounded-xl px-3.5 py-2 text-[12.5px] transition-colors",
                      isActive
                        ? "bg-neon-400/15 text-neon-300 ring-1 ring-neon-400/25"
                        : "bg-white/5 text-slate-400 hover:bg-white/8",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Rows per page" hint="Applies to every paginated table">
            <div className="flex flex-wrap gap-2">
              {[10, 25, 50].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => update({ pageSize: size })}
                  className={cx(
                    "rounded-xl px-3.5 py-2 font-mono text-[12.5px] transition-colors",
                    prefs.pageSize === size
                      ? "bg-neon-400/15 text-neon-300 ring-1 ring-neon-400/25"
                      : "bg-white/5 text-slate-400 hover:bg-white/8",
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Table density" hint="Compact fits more rows on screen">
            <div className="flex flex-wrap gap-2">
              {(["comfortable", "compact"] as const).map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => update({ density })}
                  className={cx(
                    "rounded-xl px-3.5 py-2 text-[12.5px] capitalize transition-colors",
                    prefs.density === density
                      ? "bg-neon-400/15 text-neon-300 ring-1 ring-neon-400/25"
                      : "bg-white/5 text-slate-400 hover:bg-white/8",
                  )}
                >
                  {density}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Reduce motion" hint="Respects the system accessibility setting by default">
            <button
              type="button"
              role="switch"
              aria-checked={prefs.reduceMotion}
              onClick={() => update({ reduceMotion: !prefs.reduceMotion })}
              className={cx(
                "relative h-6 w-11 rounded-full transition-colors",
                prefs.reduceMotion ? "bg-neon-400/60" : "bg-white/10",
              )}
            >
              <span
                className={cx(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-white transition-transform",
                  prefs.reduceMotion && "translate-x-5",
                )}
              />
            </button>
          </Field>
        </div>
      </Panel>

      <Panel className="xl:col-span-2">
        <PanelHeader title="API reference" subtitle="Endpoints this dashboard consumes" />
        <div className="grid gap-3 px-5 py-5 sm:px-6 md:grid-cols-2">
          {[
            { method: "GET", path: "/api/state", note: "Summary totals, pending queue and exceptions" },
            { method: "GET", path: "/health", note: "Liveness probe for the Express server" },
            { method: "POST", path: "/api/events", note: "Batch event ingestion" },
            { method: "POST", path: "/api/ack", note: "Acknowledge queued event ids" },
          ].map((route) => (
            <div
              key={route.path}
              className="flex items-start gap-3 rounded-2xl bg-white/4 px-4 py-3 ring-1 ring-white/8"
            >
              <span
                className={cx(
                  "shrink-0 rounded-md px-2 py-1 font-mono text-[10.5px] font-bold",
                  route.method === "GET"
                    ? "bg-sky-400/12 text-sky-300"
                    : "bg-violet-400/12 text-violet-300",
                )}
              >
                {route.method}
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[12.5px] text-slate-100">{route.path}</p>
                <p className="mt-0.5 text-[12px] text-slate-500">{route.note}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 border-t border-white/8 px-5 py-4 font-mono text-[11.5px] text-slate-500 sm:px-6">
          <span>{data.pending.length} pending</span>
          <span>{data.exceptions.length} exceptions</span>
          <span>{Object.values(data.summary).reduce((sum, value) => sum + value, 0)} aggregate</span>
        </div>
      </Panel>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-6">
      <span className="text-[13px] text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-slate-200">{label}</p>
      {hint ? <p className="mt-0.5 mb-3 text-[12px] text-slate-500">{hint}</p> : <div className="h-3" />}
      {children}
    </div>
  );
}