"use client";

import { cx } from "@/lib/utils";

export type ViewId = "overview" | "queue" | "exceptions" | "sources" | "settings";

export interface NavItem {
  id: ViewId;
  label: string;
  description: string;
  badge?: number;
  icon: React.ReactNode;
}

const ICONS: Record<ViewId, React.ReactNode> = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h6V3H3v10Zm0 8h6v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />
    </svg>
  ),
  queue: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  ),
  exceptions: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    </svg>
  ),
  sources: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M2 10h20v4H2z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-[18px]">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H1a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 2.6 7a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H7a1.7 1.7 0 0 0 1-1.5V1a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V7a1.7 1.7 0 0 0 1.5 1H23a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  ),
};

export function buildNav(badges: Partial<Record<ViewId, number>>): NavItem[] {
  return [
    {
      id: "overview",
      label: "Overview",
      description: "Live production pulse",
      icon: ICONS.overview,
    },
    {
      id: "queue",
      label: "Ack Queue",
      description: "Pending reference events",
      icon: ICONS.queue,
      badge: badges.queue,
    },
    {
      id: "exceptions",
      label: "Exceptions",
      description: "Duplicates & conflicts",
      icon: ICONS.exceptions,
      badge: badges.exceptions,
    },
    {
      id: "sources",
      label: "Line Sources",
      description: "Per-device rollups",
      icon: ICONS.sources,
      badge: badges.sources,
    },
    {
      id: "settings",
      label: "Settings",
      description: "Connection & preferences",
      icon: ICONS.settings,
    },
  ];
}

export function Sidebar({
  items,
  active,
  onSelect,
  connection,
}: {
  items: NavItem[];
  active: ViewId;
  onSelect: (id: ViewId) => void;
  connection: "connecting" | "live" | "offline";
}) {
  const statusLabel =
    connection === "live" ? "Live" : connection === "offline" ? "Offline" : "Syncing";

  return (
    <aside className="sticky top-0 flex h-dvh w-[248px] shrink-0 flex-col border-r border-white/8 bg-ink-900/70 backdrop-blur-xl max-lg:hidden">
      <div className="flex items-center gap-3 px-5 py-6">
        <Logo />
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight font-semibold text-white">Loomline</p>
          <p className="truncate text-[11px] tracking-[0.14em] text-slate-500 uppercase">
            Control
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map((item) => {
          const isActive = item.id === active;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cx(
                "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-neon-400/14 to-transparent text-white ring-1 ring-neon-400/20"
                  : "text-slate-400 hover:bg-white/4 hover:text-slate-100",
              )}
            >
              <span
                className={cx(
                  "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                  isActive ? "bg-neon-400/15 text-neon-300" : "bg-white/5 text-slate-400",
                )}
              >
                {item.icon}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-medium">{item.label}</span>
                <span className="block truncate text-[11px] text-slate-500">{item.description}</span>
              </span>

              {item.badge ? (
                <span className="rounded-full bg-amber-400/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-300">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              ) : null}

              {isActive ? (
                <span className="absolute top-1/2 -left-3 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-neon-400" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-4">
        <div className="flex items-center gap-2.5 rounded-xl bg-white/4 px-3 py-2.5 ring-1 ring-white/8">
          <span className="relative grid size-2 place-items-center">
            {connection === "live" ? (
              <>
                <span className="absolute size-2.5 animate-[var(--animate-pulse-ring)] rounded-full bg-neon-400" />
                <span className="size-2 rounded-full bg-neon-300" />
              </>
            ) : (
              <span
                className={cx(
                  "size-2 rounded-full",
                  connection === "offline" ? "bg-rose-400" : "bg-amber-400 animate-[var(--animate-tick)]",
                )}
              />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-slate-200">Backend {statusLabel}</p>
            <p className="truncate font-mono text-[10.5px] text-slate-500">:8080 /api/state</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav({
  items,
  active,
  onSelect,
}: {
  items: NavItem[];
  active: ViewId;
  onSelect: (id: ViewId) => void;
}) {
  return (
    <nav className="scrollbar-none sticky top-16 z-30 flex gap-2 overflow-x-auto border-b border-white/8 bg-ink-950/85 px-4 py-2.5 backdrop-blur-xl lg:hidden">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] transition-colors",
              isActive
                ? "bg-neon-400/15 text-neon-300 ring-1 ring-neon-400/25"
                : "bg-white/4 text-slate-400",
            )}
          >
            {item.label}
            {item.badge ? (
              <span className="font-mono text-[11px] text-amber-300">{item.badge}</span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function Logo({ size = 38 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-neon-400 to-violet-500 shadow-lg shadow-neon-500/20"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="#05070d" strokeWidth="2.1" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 3 3 6l3 3M18 3l3 3-3 3M6 21l-3-3 3-3M18 21l3-3-3-3M4 12h16" />
      </svg>
    </span>
  );
}