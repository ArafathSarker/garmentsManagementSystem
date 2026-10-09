"use client";

import { useMemo } from "react";
import { Badge } from "./Badge";
import { buildSparkline, cx, formatCompact, formatNumber, toPoints } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
  hint?: string;
  tone?: "neon" | "cyan" | "amber" | "rose" | "violet";
  history?: number[];
  isLoading?: boolean;
  active?: boolean;
  onClick?: () => void;
}

const TONE_RING: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neon: "from-neon-400/25",
  cyan: "from-cyan-400/25",
  amber: "from-amber-400/25",
  rose: "from-rose-400/25",
  violet: "from-violet-400/25",
};

const TONE_TEXT: Record<NonNullable<StatCardProps["tone"]>, string> = {
  neon: "text-neon-300",
  cyan: "text-cyan-300",
  amber: "text-amber-300",
  rose: "text-rose-300",
  violet: "text-violet-300",
};

export function StatCard({
  label,
  value,
  delta,
  hint,
  tone = "neon",
  history = [],
  isLoading = false,
  active = false,
  onClick,
}: StatCardProps) {
  // Only recompute the polyline when the underlying series actually changes.
  const spark = useMemo(() => {
    const series = buildSparkline(history);
    const points = toPoints(series, 120, 34);
    const area = points ? `${points} 120,34 0,34` : "";
    return { points, area };
  }, [history]);

  const trend = delta === undefined ? null : delta >= 0;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        "glass group relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-300",
        "hover:-translate-y-0.5 hover:shadow-[0_28px_70px_-30px_rgb(0_0_0/1)]",
        onClick ? "cursor-pointer" : "cursor-default",
        active && "ring-1 ring-neon-400/50",
      )}
    >
      <div
        className={cx(
          "pointer-events-none absolute -top-16 -right-10 size-40 rounded-full bg-gradient-to-br to-transparent opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100",
          TONE_RING[tone],
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold tracking-[0.14em] text-slate-400 uppercase">
          {label}
        </span>
        {trend !== null && !isLoading ? (
          <Badge tone={trend ? "emerald" : "rose"}>
            {trend ? "▲" : "▼"} {Math.abs(delta!).toFixed(1)}%
          </Badge>
        ) : null}
      </div>

      <div className="relative mt-3 flex items-end justify-between gap-4">
        <div>
          {isLoading ? (
            <div className="skeleton h-9 w-24 rounded-lg bg-white/8" />
          ) : (
            <p className={cx("font-mono text-3xl leading-none font-semibold tracking-tight", TONE_TEXT[tone])}>
              {formatNumber(value)}
            </p>
          )}
          <p className="mt-2 text-[12px] text-slate-500">{hint ?? formatCompact(value)} units</p>
        </div>

        <svg
          viewBox="0 0 120 34"
          preserveAspectRatio="none"
          className="h-10 w-28 shrink-0 overflow-visible"
          aria-hidden
        >
          <defs>
            <linearGradient id={`fill-${label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g className={TONE_TEXT[tone]}>
            {spark.area ? <polygon points={spark.area} fill={`url(#fill-${label})`} /> : null}
            {spark.points ? (
              <polyline
                points={spark.points}
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
          </g>
        </svg>
      </div>
    </button>
  );
}