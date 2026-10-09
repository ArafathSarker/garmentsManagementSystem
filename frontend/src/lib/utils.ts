import type { Classification, EventType } from "./api";

export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(" ");

export function formatNumber(value: number | null | undefined, decimals = 0): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCompact(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(
    value,
  );
}

export function formatRelative(input: string | null | undefined): string {
  if (!input) return "—";
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return "—";

  const diffSeconds = Math.round((Date.now() - then) / 1000);
  const abs = Math.abs(diffSeconds);

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60) return rtf.format(-diffSeconds, "second");
  if (abs < 3600) return rtf.format(-Math.round(diffSeconds / 60), "minute");
  if (abs < 86_400) return rtf.format(-Math.round(diffSeconds / 3600), "hour");
  return rtf.format(-Math.round(diffSeconds / 86_400), "day");
}

export function formatClock(input: string | null | undefined): string {
  if (!input) return "—";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export type Tone = "emerald" | "amber" | "rose" | "sky" | "violet" | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  emerald: "bg-emerald-500/12 text-emerald-300 ring-emerald-400/25",
  amber: "bg-amber-500/12 text-amber-300 ring-amber-400/25",
  rose: "bg-rose-500/12 text-rose-300 ring-rose-400/25",
  sky: "bg-sky-500/12 text-sky-300 ring-sky-400/25",
  violet: "bg-violet-500/12 text-violet-300 ring-violet-400/25",
  slate: "bg-slate-500/12 text-slate-300 ring-slate-400/25",
};

const DOT_CLASSES: Record<Tone, string> = {
  emerald: "bg-emerald-400",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  slate: "bg-slate-400",
};

export function toneClasses(tone: Tone): string {
  return TONE_CLASSES[tone];
}

export function dotClass(tone: Tone): string {
  return DOT_CLASSES[tone];
}

export function typeTone(type: string): Tone {
  switch (type.toUpperCase()) {
    case "COUNT":
      return "sky";
    case "VOID":
      return "violet";
    default:
      return "slate";
  }
}

export function statusTone(status: string): Tone {
  switch (status.toUpperCase()) {
    case "ACCEPTED":
      return "emerald";
    case "PENDING_REFERENCE":
      return "amber";
    case "DUPLICATE":
      return "sky";
    case "CONFLICT":
    case "REJECTED":
      return "rose";
    default:
      return "slate";
  }
}

export function classificationTone(classification: Classification | string): Tone {
  switch (classification.toUpperCase()) {
    case "ACCEPTED":
      return "emerald";
    case "PENDING_REFERENCE":
      return "amber";
    case "DUPLICATE":
      return "sky";
    case "CONFLICT":
      return "rose";
    case "REJECTED":
      return "violet";
    default:
      return "slate";
  }
}

export function isEventType(value: string): value is EventType {
  return value === "COUNT" || value === "VOID";
}

export function initials(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, "");
  return (cleaned.slice(0, 2) || "?").toUpperCase();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Stable pseudo-random in [0,1) derived from a string — keeps sparklines deterministic. */
export function seededNoise(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10_000) / 10_000;
}

export function buildSparkline(values: number[], points = 28): number[] {
  if (values.length === 0) return Array.from({ length: points }, () => 0);
  if (values.length >= points) return values.slice(-points);

  const padding: number[] = [];
  for (let i = 0; i < points - values.length; i += 1) {
    padding.push(values[0] * (0.75 + seededNoise(`${i}-${values[0]}`) * 0.3));
  }
  return [...padding, ...values];
}

export function toPoints(values: number[], width: number, height: number, pad = 2): string {
  if (values.length < 2) return "";
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const stepX = (width - pad * 2) / (values.length - 1);

  return values
    .map((value, index) => {
      const x = pad + index * stepX;
      const y = pad + (1 - (value - min) / span) * (height - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
}