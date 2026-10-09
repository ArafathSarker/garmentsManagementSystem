"use client";

import { useMemo } from "react";
import { cx, formatCompact, toPoints } from "@/lib/utils";

/** Animated gradient area chart. Pure SVG — no chart library dependency. */
export function TrendChart({
  series,
  height = 200,
  tone = "#34e3b0",
  label,
}: {
  series: number[];
  height?: number;
  tone?: string;
  label: string;
}) {
  const { points, area, last } = useMemo(() => {
    const width = 600;
    const line = toPoints(series, width, height, 6);
    return {
      points: line,
      area: line ? `${line} ${width - 6},${height - 6} 6,${height - 6}` : "",
      last: series.at(-1) ?? 0,
    };
  }, [series, height]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 600 ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tone} stopOpacity="0.4" />
            <stop offset="100%" stopColor={tone} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2="600"
            y1={height * ratio}
            y2={height * ratio}
            stroke="currentColor"
            strokeOpacity="0.07"
            strokeDasharray="4 6"
          />
        ))}

        {area ? <polygon points={area} fill="url(#trend-fill)" /> : null}
        {points ? (
          <polyline
            points={points}
            fill="none"
            stroke={tone}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-between font-mono text-[10px] text-slate-500">
        <span>−40s</span>
        <span>−20s</span>
        <span>now</span>
      </div>

      <div className="absolute right-3 top-3 rounded-lg bg-ink-900/80 px-2.5 py-1 font-mono text-[11px] text-neon-300 ring-1 ring-white/10 backdrop-blur">
        {formatCompact(last)}
      </div>
    </div>
  );
}

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** Donut rendered with stroke-dasharray on a circle — crisp at any size. */
export function DonutChart({
  slices,
  size = 168,
  thickness = 16,
  centerLabel,
  centerValue,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel: string;
  centerValue: string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const arcs = useMemo(() => {
    // Cumulative fraction gives each slice its start offset without mutating outer state.
    const fractions = slices.map((slice) => (total ? slice.value / total : 0));
    return slices.map((slice, index) => ({
      ...slice,
      dash: fractions[index] * circumference,
      offset: fractions.slice(0, index).reduce((sum, value) => sum + value, 0) * circumference,
      percent: Math.round(fractions[index] * 100),
    }));
  }, [slices, total, circumference]);

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth={thickness}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${arc.dash} ${circumference - arc.dash}`}
              strokeDashoffset={-arc.offset}
              className="transition-[stroke-dasharray,stroke-dashoffset] duration-700 ease-out"
            />
          ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-mono text-2xl font-semibold text-white">{centerValue}</p>
            <p className="text-[10px] tracking-[0.16em] text-slate-500 uppercase">{centerLabel}</p>
          </div>
        </div>
      </div>

      <ul className="min-w-[160px] flex-1 space-y-2.5">
        {arcs.map((arc) => (
          <li key={arc.label} className="flex items-center justify-between gap-4 text-[13px]">
            <span className="flex items-center gap-2 text-slate-300">
              <span
                className="size-2.5 rounded-[3px]"
                style={{ backgroundColor: arc.color, boxShadow: `0 0 12px ${arc.color}66` }}
              />
              {arc.label}
            </span>
            <span className="font-mono text-slate-400">
              {formatCompact(arc.value)}
              <span className="ml-2 w-9 text-right text-slate-600">{arc.percent}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HorizontalBars({
  rows,
}: {
  rows: Array<{ label: string; value: number; hint?: string }>;
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className="space-y-4">
      {rows.map((row, index) => (
        <li key={row.label}>
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <span className="truncate text-slate-300">{row.label}</span>
            <span className="font-mono text-slate-400">{formatCompact(row.value)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/6">
            <div
              className={cx(
                "h-full rounded-full transition-[width] duration-700 ease-out",
                index % 3 === 0
                  ? "bg-gradient-to-r from-neon-500 to-neon-300"
                  : index % 3 === 1
                    ? "bg-gradient-to-r from-cyan-500 to-cyan-300"
                    : "bg-gradient-to-r from-violet-500 to-violet-300",
              )}
              style={{ width: `${Math.max(4, (row.value / max) * 100)}%` }}
            />
          </div>
          {row.hint ? <p className="mt-1 text-[11px] text-slate-500">{row.hint}</p> : null}
        </li>
      ))}
    </ul>
  );
}