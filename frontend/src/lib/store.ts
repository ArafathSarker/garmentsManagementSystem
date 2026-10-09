"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  api,
  ApiError,
  EMPTY_SUMMARY,
  type PendingEvent,
  type StateResponse,
} from "./api";

/* ------------------------------------------------------------------ */
/* Polling                                                             */
/* ------------------------------------------------------------------ */

export type ConnectionState = "connecting" | "live" | "offline";

interface FactorySnapshot {
  data: StateResponse;
  connection: ConnectionState;
  lastSync: number | null;
  error: string | null;
  latency: number | null;
  history: number[];
  pollingMs: number;
  isRefreshing: boolean;
  selected: Set<string>;
  paused: boolean;
  sourceFilter: string | null;
}

const POLL_MS = 5_000;
const HISTORY_LIMIT = 40;
const INITIAL: StateResponse = { summary: EMPTY_SUMMARY, pending: [], exceptions: [] };

let snapshot: FactorySnapshot = {
  data: INITIAL,
  connection: "connecting",
  lastSync: null,
  error: null,
  latency: null,
  history: [],
  pollingMs: POLL_MS,
  isRefreshing: false,
  selected: new Set<string>(),
  paused: false,
  sourceFilter: null,
};

const listeners = new Set<() => void>();

const emit = () => {
  snapshot = { ...snapshot };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getServerSnapshot = (): FactorySnapshot => snapshot;
const getSnapshot = (): FactorySnapshot => snapshot;

let refreshGeneration = 0;

async function refresh(reason: "poll" | "manual" = "poll"): Promise<void> {
  const thisGen = ++refreshGeneration;

  if (reason === "manual") {
    snapshot = { ...snapshot, isRefreshing: true };
    emit();
  }

  const startedAt = performance.now();

  try {
    const data = await api.getState(undefined, snapshot.sourceFilter || undefined);
    const latency = Math.round(performance.now() - startedAt);

    // If a newer refresh was started while we were waiting, discard this result.
    if (thisGen !== refreshGeneration) return;

    snapshot = {
      ...snapshot,
      data,
      connection: "live",
      lastSync: Date.now(),
      latency,
      error: null,
      isRefreshing: false,
      history: [...snapshot.history, data.summary.net_total].slice(-HISTORY_LIMIT),
    };
  } catch (error) {
    // Stale response — a newer refresh superseded this one.
    if (thisGen !== refreshGeneration) return;

    const message =
      error instanceof ApiError && error.status === 0
        ? "Backend is unreachable"
        : error instanceof Error
          ? error.message
          : "Unexpected error";

    snapshot = {
      ...snapshot,
      connection: "offline",
      error: message,
      isRefreshing: false,
    };
  }

  emit();
}

export function useFactoryState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let active = true;
    const poll = () => {
      if (!active) return;
      void refresh("poll").catch(() => {
        /* refresh handles its own failures */
      });
    };

    poll();
    const timer = setInterval(() => {
      if (!snapshot.paused && document.visibilityState === "visible") poll();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !snapshot.paused) poll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return state;
}

/* ------------------------------------------------------------------ */
/* Actions                                                             */
/* ------------------------------------------------------------------ */

function setPolling(ms: number) {
  snapshot = { ...snapshot, pollingMs: ms };
  emit();
  if (ms > 0) {
    setTimeout(() => void refresh("manual"), 80);
  }
}

function togglePaused() {
  const paused = !snapshot.paused;
  snapshot = { ...snapshot, paused };
  emit();
  if (!paused) void refresh("manual");
}

function toggleSelect(id: string) {
  const selected = new Set(snapshot.selected);
  if (selected.has(id)) selected.delete(id);
  else selected.add(id);
  snapshot = { ...snapshot, selected };
  emit();
}

function setSelection(ids: string[]) {
  snapshot = { ...snapshot, selected: new Set(ids) };
  emit();
}

function clearSelection() {
  snapshot = { ...snapshot, selected: new Set<string>() };
  emit();
}

async function acknowledge(ids: string[]): Promise<{ ok: boolean; message: string }> {
  const targets = ids.length ? ids : [...snapshot.selected];
  if (targets.length === 0) return { ok: false, message: "Nothing selected" };

  // Optimistic UI: drop the rows from the queue immediately, restore on failure.
  const previousPending = snapshot.data.pending;
  const removed = new Set(targets);
  snapshot = {
    ...snapshot,
    data: { ...snapshot.data, pending: previousPending.filter((row) => !removed.has(rowKey(row))) },
    selected: new Set<string>(),
  };
  emit();

  try {
    const response = await api.ackEvents(targets);
    const failed = response.results.filter((r) => r.result !== "ACKED");
    await refresh("manual");

    return failed.length
      ? { ok: false, message: `${failed.length} acknowledgement(s) rejected` }
      : { ok: true, message: `${targets.length} event(s) acknowledged` };
  } catch {
    snapshot = { ...snapshot, data: { ...snapshot.data, pending: previousPending } };
    emit();
    return { ok: false, message: "Acknowledgement failed — change reverted" };
  }
}

function setSourceFilter(sourceFilter: string | null) {
  if (snapshot.sourceFilter === sourceFilter) return;
  snapshot = { ...snapshot, sourceFilter };
  emit();
  void refresh("manual");
}

export const actions = {
  refresh: () => refresh("manual"),
  acknowledge,
  togglePaused,
  toggleSelect,
  setSelection,
  clearSelection,
  setPolling,
  setSourceFilter,
};

/* ------------------------------------------------------------------ */
/* Selectors                                                          */
/* ------------------------------------------------------------------ */

export const rowKey = (row: PendingEvent): string => `${row.source_id}::${row.event_id}`;

export interface SourceRollup {
  sourceId: string;
  pending: number;
  voids: number;
  netTotal: number;
  oldestPendingAt: string | null;
}

function rollupSources(pending: PendingEvent[], netTotal: number): SourceRollup[] {
  const map = new Map<string, SourceRollup>();

  pending.forEach((row) => {
    const entry = map.get(row.source_id) ?? {
      sourceId: row.source_id,
      pending: 0,
      voids: 0,
      netTotal: 0,
      oldestPendingAt: null,
    };
    entry.pending += 1;
    if (row.type === "VOID") entry.voids += 1;

    const time = new Date(row.event_time).getTime();
    if (
      entry.oldestPendingAt === null ||
      (!Number.isNaN(time) && time < new Date(entry.oldestPendingAt).getTime())
    ) {
      entry.oldestPendingAt = row.event_time;
    }
    map.set(row.source_id, entry);
  });

  const out = [...map.values()].map((entry) => ({
    ...entry,
    netTotal: pending.length ? Math.round((netTotal * entry.pending) / pending.length) : 0,
  }));

  return out.sort((a, b) => b.pending - a.pending || a.sourceId.localeCompare(b.sourceId));
}

export function useDerivedState() {
  const state = useFactoryState();

  const sources = useMemo(
    () => rollupSources(state.data.pending, state.data.summary.net_total),
    [state.data.pending, state.data.summary.net_total],
  );

  const unresolved = useMemo(
    () =>
      state.data.exceptions.filter(
        (e) => e.classification !== "ACCEPTED" && e.classification !== "PENDING_REFERENCE",
      ),
    [state.data.exceptions],
  );

  const selectedIds = useMemo(() => [...state.selected], [state.selected]);

  const health = useMemo(() => {
    const { summary, pending } = state.data;
    const total = summary.processed_events + pending.length;
    const acceptanceRate = total ? summary.processed_events / total : 1;
    const errorBudget = summary.unresolved + summary.conflicts + summary.duplicates;
    const cleanRate = total ? Math.max(0, 1 - errorBudget / total) : 1;
    return { acceptanceRate, cleanRate, errorBudget };
  }, [state.data]);

  return { ...state, sources, unresolved, selectedIds, health };
}

/* ------------------------------------------------------------------ */
/* Local preferences (persisted)                                      */
/* ------------------------------------------------------------------ */

const PREF_KEY = "loomline.prefs.v1";

interface Prefs {
  pageSize: number;
  density: "comfortable" | "compact";
  reduceMotion: boolean;
}

const DEFAULT_PREFS: Prefs = { pageSize: 10, density: "comfortable", reduceMotion: false };

function readStoredPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<Prefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

export function usePrefs() {
  // Read lazily during the first render rather than in an effect — avoids a
  // default -> stored flash and an extra render pass on mount.
  const [prefs, setPrefs] = useState<Prefs>(readStoredPrefs);

  const update = useCallback((patch: Partial<Prefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem(PREF_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  return { prefs, update };
}

/** Measures element width for genuinely responsive charts (ResizeObserver, no layout thrash). */
export function useElementWidth<T extends HTMLElement>(fallback = 640) {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width ?? fallback;
      setWidth((current) => (Math.abs(current - next) > 1 ? next : current));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fallback]);

  return { ref, width };
}