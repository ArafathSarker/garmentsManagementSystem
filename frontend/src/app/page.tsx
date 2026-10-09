import ControlDeckBoundary from "./control-deck";

/**
 * `page.tsx` stays a Server Component: it renders only the static ambient background.
 * The interactive dashboard is loaded client-side through `./control-deck`, a Client
 * Component boundary — the only legal place for `next/dynamic({ ssr: false })`.
 */
export default function Home() {
  return (
    <div className="relative min-h-dvh bg-ink-950">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="grid-backdrop absolute inset-0 opacity-30" />
        <div className="absolute -top-32 left-1/4 size-[460px] animate-[var(--animate-drift)] rounded-full bg-violet-600/16 blur-[120px]" />
        <div
          className="absolute top-1/2 -right-40 size-[420px] animate-[var(--animate-drift)] rounded-full bg-neon-500/12 blur-[120px]"
          style={{ animationDelay: "-9s" }}
        />
      </div>

      <ControlDeckBoundary />

      <noscript>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h1 className="text-2xl font-bold text-white">Loomline Control</h1>
          <p className="mt-3 text-sm text-slate-400">
            This dashboard needs JavaScript enabled to stream live production events.
          </p>
        </div>
      </noscript>
    </div>
  );
}