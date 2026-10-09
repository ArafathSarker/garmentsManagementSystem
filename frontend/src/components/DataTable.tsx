"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { cx, clamp } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** Value used for sorting + text search. */
  accessor: (row: T) => string | number | null | undefined;
  render?: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  sortable?: boolean;
  hideOnSm?: boolean;
}

export interface DataTableProps<T> {
  rows: T[];
  columns: Array<Column<T>>;
  getKey: (row: T) => string;
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  selectable?: boolean;
  selected?: Set<string>;
  onToggleRow?: (key: string) => void;
  onToggleAll?: (keys: string[]) => void;
  rowActions?: (row: T) => React.ReactNode;
  searchKeys?: Array<(row: T) => string>;
  toolbarExtra?: React.ReactNode;
  renderSkeleton?: React.ReactNode;
  rowClassName?: (row: T) => string | undefined;
}

const PAGE_SIZES = [10, 25, 50];

export function DataTable<T>({
  rows,
  columns,
  getKey,
  isLoading = false,
  emptyTitle = "Nothing to show",
  emptyDescription,
  pageSize = 10,
  onPageSizeChange,
  selectable = false,
  selected,
  onToggleRow,
  onToggleAll,
  rowActions,
  searchKeys = [],
  toolbarExtra,
  renderSkeleton,
  rowClassName,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Keeps typing responsive on large datasets: the list updates at lower priority.
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();
    if (!term) return rows;

    const accessors = searchKeys.length
      ? searchKeys
      : columns.map((column) => (row: T) => String(column.accessor(row) ?? ""));

    return rows.filter((row) =>
      accessors.some((accessor) => accessor(row).toLowerCase().includes(term)),
    );
  }, [rows, deferredQuery, searchKeys, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const column = columns.find((entry) => entry.key === sortKey);
    if (!column) return filtered;

    const factor = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = column.accessor(a);
      const right = column.accessor(b);

      if (typeof left === "number" && typeof right === "number") {
        return (left - right) * factor;
      }

      const leftText = String(left ?? "").toLowerCase();
      const rightText = String(right ?? "").toLowerCase();
      if (leftText === rightText) return 0;
      return leftText < rightText ? -factor : factor;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  // Derived rather than synchronised in an effect: shrinking the result set immediately
  // clamps the page instead of rendering an empty table for a frame.
  const safePage = clamp(page, 1, totalPages);

  const visible = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  const visibleKeys = useMemo(() => visible.map(getKey), [visible, getKey]);
  const allVisibleSelected =
    selectable && visibleKeys.length > 0 && visibleKeys.every((key) => selected?.has(key));

  const resetToFirstPage = useCallback(() => setPage(1), []);

  const toggleSort = useCallback((key: string) => {
    setPage(1);
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
        return currentKey;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const columnCount = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const from = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, sorted.length);

  const pageNumbers = useMemo(() => {
    const window = 1;
    const start = Math.max(1, safePage - window);
    const end = Math.min(totalPages, safePage + window);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [safePage, totalPages]);

  return (
    <div className="flex min-h-0 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/8 px-5 py-3.5 sm:px-6">
        <div className="relative min-w-[200px] flex-1">
          <svg
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
          </svg>
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              resetToFirstPage();
            }}
            placeholder="Filter by event, source, status…"
            aria-label="Filter table"
            className="w-full rounded-xl border border-white/10 bg-white/4 py-2 pr-3 pl-9 text-sm text-slate-200 placeholder:text-slate-500 focus:border-neon-400/40 focus:bg-white/6 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                resetToFirstPage();
              }}
              aria-label="Clear filter"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md px-1.5 py-0.5 text-slate-500 transition-colors hover:text-slate-200"
            >
              ✕
            </button>
          ) : null}
        </div>

        {toolbarExtra}

        {onPageSizeChange ? (
          <label className="flex items-center gap-2 text-[12px] text-slate-400">
            <span className="hidden sm:inline">Rows</span>
            <select
              value={pageSize}
              onChange={(event) => {
                onPageSizeChange(Number(event.target.value));
                resetToFirstPage();
              }}
              className="rounded-lg border border-white/10 bg-white/4 px-2 py-1.5 font-mono text-[12px] text-slate-200 focus:border-neon-400/40 focus:outline-none"
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size} className="bg-ink-900">
                  {size}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {/* Body */}
      {isLoading ? (
        (renderSkeleton ?? <div className="skeleton h-64 w-full" />)
      ) : (
        <div className="min-h-0 flex-1 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/8 text-left text-[11px] tracking-[0.12em] text-slate-500 uppercase">
                {selectable ? (
                  <th scope="col" className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={() => onToggleAll?.(visibleKeys)}
                      aria-label="Select all visible rows"
                      className="size-4 cursor-pointer accent-neon-400"
                    />
                  </th>
                ) : null}

                {columns.map((column) => {
                  const sortable = column.sortable !== false;
                  const isSorted = sortKey === column.key;

                  return (
                    <th
                      key={column.key}
                      scope="col"
                      style={{ width: column.width }}
                      className={cx(
                        "px-4 py-3 font-semibold whitespace-nowrap",
                        column.align === "right" && "text-right",
                        column.align === "center" && "text-center",
                        column.hideOnSm && "hidden lg:table-cell",
                        sortable && "cursor-pointer hover:text-slate-200",
                        isSorted && "text-neon-300",
                      )}
                      onClick={sortable ? () => toggleSort(column.key) : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {column.header}
                        {isSorted ? (
                          <span aria-hidden>{sortDir === "asc" ? "↑" : "↓"}</span>
                        ) : null}
                      </span>
                    </th>
                  );
                })}

                {rowActions ? <th className="w-16 px-5 py-3" /> : null}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columnCount} className="px-6 py-14 text-center">
                    <p className="text-sm font-medium text-slate-300">{emptyTitle}</p>
                    {emptyDescription ? (
                      <p className="mx-auto mt-1 max-w-sm text-[13px] text-slate-500">
                        {emptyDescription}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ) : (
                visible.map((row) => {
                  const key = getKey(row);
                  const isSelected = selected?.has(key) ?? false;

                  return (
                    <tr
                      key={key}
                      data-state={isSelected ? "selected" : undefined}
                      className={cx(
                        "transition-colors duration-150 hover:bg-white/4",
                        isSelected && "bg-neon-400/6",
                        rowClassName?.(row),
                      )}
                    >
                      {selectable ? (
                        <td className="px-5 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleRow?.(key)}
                            aria-label={`Select row ${key}`}
                            className="size-4 cursor-pointer accent-neon-400"
                          />
                        </td>
                      ) : null}

                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cx(
                            "px-4 py-3 text-slate-300",
                            column.align === "right" && "text-right",
                            column.align === "center" && "text-center",
                            column.hideOnSm && "hidden lg:table-cell",
                          )}
                        >
                          {column.render ? column.render(row) : (column.accessor(row) ?? "—")}
                        </td>
                      ))}

                      {rowActions ? (
                        <td className="px-5 py-3 text-right">{rowActions(row)}</td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {sorted.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 px-5 py-3 text-[12px] text-slate-400 sm:px-6">
          <span className="font-mono">
            {from}–{to} of {sorted.length}
          </span>

          <div className="flex items-center gap-1">
            <PagerButton onClick={() => setPage(1)} disabled={safePage === 1} label="«" />
            <PagerButton onClick={() => setPage((p) => p - 1)} disabled={safePage === 1} label="‹" />

            {pageNumbers.map((number) => (
              <button
                key={number}
                type="button"
                onClick={() => setPage(number)}
                aria-current={number === safePage ? "page" : undefined}
                className={cx(
                  "size-8 rounded-lg font-mono text-[12px] transition-colors",
                  number === safePage
                    ? "bg-neon-400/15 text-neon-300 ring-1 ring-neon-400/30"
                    : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
                )}
              >
                {number}
              </button>
            ))}

            <PagerButton
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage === totalPages}
              label="›"
            />
            <PagerButton
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              label="»"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PagerButton({
  onClick,
  disabled,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid size-8 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-white/6 hover:text-slate-200 disabled:pointer-events-none disabled:opacity-30"
    >
      {label}
    </button>
  );
}