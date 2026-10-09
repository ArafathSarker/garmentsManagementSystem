"use client";

import { cx, dotClass, toneClasses, type Tone } from "@/lib/utils";

export function Badge({
  children,
  tone = "slate",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase ring-1 ring-inset",
        toneClasses(tone),
        className,
      )}
    >
      {dot ? <span className={cx("size-1.5 rounded-full", dotClass(tone))} /> : null}
      {children}
    </span>
  );
}