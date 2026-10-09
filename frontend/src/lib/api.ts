/**
 * Typed contracts mirroring the Express REST API exposed by `backend/src/app/index.ts`.
 * Every shape is defensively normalised at the boundary because the API is still being
 * wired to the persistence layer (see the route handlers under `backend/src/modules`).
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? 
  (typeof window !== "undefined" ? `http://${window.location.hostname}:8080` : "http://localhost:8080");

export type EventType = "COUNT" | "VOID";
export type EventStatus = "ACCEPTED" | "PENDING_REFERENCE";
export type Classification =
  | "ACCEPTED"
  | "PENDING_REFERENCE"
  | "DUPLICATE"
  | "CONFLICT"
  | "REJECTED";

export interface SystemStateSummary {
  net_total: number;
  processed_events: number;
  pending_void: number;
  unresolved: number;
  duplicates: number;
  conflicts: number;
}

export interface PendingEvent {
  source_id: string;
  event_id: string;
  type: EventType | string;
  quantity?: number | null;
  target_event_id?: string | null;
  status: EventStatus | string;
  event_time: string;
  acknowledged_at?: string | null;
}

export interface ExceptionRecord {
  id: string;
  source_id?: string | null;
  event_id?: string | null;
  classification: Classification | string;
  reason?: string | null;
  received_at?: string | null;
}

export interface StateResponse {
  summary: SystemStateSummary;
  pending: PendingEvent[];
  exceptions: ExceptionRecord[];
}

export interface AckResult {
  event_id: string;
  result: "ACKED" | "FAILED";
}

export interface AckResponse {
  message: string;
  results: AckResult[];
}

export interface HealthResponse {
  status: string;
  mqtt?: { connected: boolean };
  uptime_s?: number;
}

export const EMPTY_SUMMARY: SystemStateSummary = {
  net_total: 0,
  processed_events: 0,
  pending_void: 0,
  unresolved: 0,
  duplicates: 0,
  conflicts: 0,
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (!response.ok) {
      throw new ApiError(`Request to ${path} failed`, response.status);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

const num = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;

function toPending(raw: unknown): PendingEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const sourceId = str(r.source_id);
  const eventId = str(r.event_id);
  if (!sourceId && !eventId) return null;

  return {
    source_id: sourceId,
    event_id: eventId,
    type: str(r.type, "COUNT").toUpperCase(),
    quantity: typeof r.quantity === "number" ? r.quantity : null,
    target_event_id: str(r.target_event_id) || null,
    status: str(r.status, "PENDING_REFERENCE").toUpperCase(),
    event_time: str(r.event_time) || new Date().toISOString(),
    acknowledged_at: str(r.acknowledged_at) || null,
  };
}

function toException(raw: unknown, index: number): ExceptionRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return {
    id: str(r.id, `exc-${index}`),
    source_id: str(r.source_id) || null,
    event_id: str(r.event_id) || null,
    classification: str(r.classification, "UNRESOLVED").toUpperCase(),
    reason: str(r.reason) || null,
    received_at: str(r.received_at) || null,
  };
}

/** Normalises the raw `/api/state` payload so the UI never has to defend itself. */
export function normalizeState(raw: unknown): StateResponse {
  const data = (raw ?? {}) as Record<string, unknown>;
  const s = (data.summary ?? {}) as Record<string, unknown>;

  const pending = Array.isArray(data.pending)
    ? data.pending.map(toPending).filter((p): p is PendingEvent => p !== null)
    : [];

  const exceptions = Array.isArray(data.exceptions)
    ? data.exceptions.map(toException).filter((e): e is ExceptionRecord => e !== null)
    : [];

  return {
    summary: {
      net_total: num(s.net_total),
      processed_events: num(s.processed_events),
      pending_void: num(s.pending_void),
      unresolved: num(s.unresolved),
      duplicates: num(s.duplicates),
      conflicts: num(s.conflicts),
    },
    pending,
    exceptions,
  };
}

export const api = {
  getState: async (signal?: AbortSignal): Promise<StateResponse> => {
    const res = await fetch(`${API_BASE_URL}/api/state`, { cache: "no-store", signal });
    if (!res.ok) throw new ApiError("Failed to fetch state", res.status);
    return normalizeState(await res.json());
  },

  getHealth: async (signal?: AbortSignal): Promise<HealthResponse> => {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store", signal });
    if (!res.ok) throw new ApiError("Backend unreachable", res.status);
    return (await res.json()) as HealthResponse;
  },

  ackEvents: (eventIds: string[]): Promise<AckResponse> =>
    request<AckResponse>("/api/ack", {
      method: "POST",
      body: JSON.stringify({ event_ids: eventIds }),
    }),

  submitEvents: (events: unknown[]): Promise<{ message: string; count: number }> =>
    request<{ message: string; count: number }>("/api/events", {
      method: "POST",
      body: JSON.stringify(events),
    }),
};