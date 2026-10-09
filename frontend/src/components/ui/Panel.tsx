"use client";

import { cx } from "@/lib/utils";

export function Panel({
  className,
  children,
  as: Tag = "section",
}: {
  className?: string;
  children: React.ReactNode;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Tag
      className={cx(
        "glass relative overflow-hidden rounded-3xl animate-[var(--animate-rise)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
      {children}
    </Tag>
  );
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 px-5 py-4 sm:px-6">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-white/6 text-neon-300 ring-1 ring-white/10">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-[15px] font-semibold tracking-tight text-white">{title}</h2>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] leading-snug text-slate-400">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  );
}