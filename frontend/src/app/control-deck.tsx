"use client";

import dynamic from "next/dynamic";

/**
 * Thin Client Component boundary. `ssr: false` is illegal inside a Server Component,
 * so the lazy import is declared here while `page.tsx` remains a Server Component.
 */
const ControlDeck = dynamic(() => import("@/components/shell/ControlDeck"), {
  ssr: false,
  loading: () => <BootSkeleton />,
});

export default function ControlDeckBoundary() {
  return <ControlDeck />;
}

function BootSkeleton() {
  return (
    <div className="flex min-h-dvh">
      <div className="hidden w-[248px] shrink-0 border-r border-white/8 lg:block">
        <div className="space-y-4 p-5">
          <div className="skeleton h-9 w-36 rounded-xl bg-white/6" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="skeleton h-12 rounded-xl bg-white/4" />
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-5 p-6">
        <div className="skeleton h-16 w-full rounded-2xl bg-white/5" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="skeleton h-28 rounded-3xl bg-white/5" />
          ))}
        </div>
        <div className="skeleton h-72 w-full rounded-3xl bg-white/5" />
      </div>
    </div>
  );
}