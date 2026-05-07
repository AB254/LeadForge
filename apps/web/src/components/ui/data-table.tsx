"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  selectable?: boolean;
  selectedRows?: Set<number>;
  onSelectionChange?: (selected: Set<number>) => void;
  pageSize?: number;
  className?: string;
}

type SortDirection = "asc" | "desc" | null;

function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data found",
  emptyIcon,
  selectable = false,
  selectedRows: controlledSelected,
  onSelectionChange,
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<SortDirection>(null);
  const [internalSelected, setInternalSelected] = React.useState<Set<number>>(new Set());
  const [page, setPage] = React.useState(0);

  const selected = controlledSelected ?? internalSelected;
  const setSelected = onSelectionChange ?? setInternalSelected;

  const sortedData = React.useMemo(() => {
    if (!sortKey || !sortDir) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDir === "asc" ? aVal - bVal : bVal - aVal;
      }
      const aStr = String(aVal);
      const bStr = String(bVal);
      return sortDir === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const pagedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  React.useEffect(() => {
    setPage(0);
  }, [data.length, sortKey, sortDir]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
      else setSortDir("asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const toggleRow = (index: number) => {
    const globalIndex = page * pageSize + index;
    const next = new Set(selected);
    if (next.has(globalIndex)) next.delete(globalIndex);
    else next.add(globalIndex);
    setSelected(next);
  };

  const toggleAll = () => {
    if (pagedData.length === 0) return;
    const pageIndices = pagedData.map((_, i) => page * pageSize + i);
    const allSelected = pageIndices.every((i) => selected.has(i));
    const next = new Set(selected);
    if (allSelected) {
      pageIndices.forEach((i) => next.delete(i));
    } else {
      pageIndices.forEach((i) => next.add(i));
    }
    setSelected(next);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortKey !== columnKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />;
    if (sortDir === "asc") return <ChevronUp className="h-3.5 w-3.5 text-[var(--color-primary)]" />;
    return <ChevronDown className="h-3.5 w-3.5 text-[var(--color-primary)]" />;
  };

  if (loading) {
    return (
      <div className={cn("w-full overflow-x-auto rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl", className)}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {selectable && <th className="w-12 p-3"><Skeleton className="h-4 w-4" /></th>}
              {columns.map((col) => (
                <th key={col.key} className="p-3 text-left">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--color-border)] last:border-b-0">
                {selectable && <td className="p-3"><Skeleton className="h-4 w-4" /></td>}
                {columns.map((col) => (
                  <td key={col.key} className="p-3">
                    <Skeleton className="h-4 w-full max-w-[120px]" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl py-16", className)}>
        {emptyIcon && <div className="mb-4 text-[var(--color-text-dim)]">{emptyIcon}</div>}
        <p className="text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full space-y-0 rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass)] backdrop-blur-xl", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {selectable && (
                <th className="w-12 p-3">
                  <input
                    type="checkbox"
                    checked={pagedData.length > 0 && pagedData.every((_, i) => selected.has(page * pageSize + i))}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    "p-3 text-left text-xs font-semibold uppercase tracking-wider text-[var(--color-text-dim)]",
                    col.sortable && "cursor-pointer select-none hover:text-[var(--color-text-muted)]"
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon columnKey={col.key} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pagedData.map((row, i) => {
              const globalIndex = page * pageSize + i;
              return (
                <tr
                  key={globalIndex}
                  className={cn(
                    "border-b border-[var(--color-border)] last:border-b-0 transition-colors",
                    "hover:bg-[var(--color-surface-hover)]",
                    selected.has(globalIndex) && "bg-[var(--color-primary)]/5"
                  )}
                >
                  {selectable && (
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected.has(globalIndex)}
                        onChange={() => toggleRow(i)}
                        className="h-4 w-4 rounded border-[var(--color-border)] bg-[var(--color-surface)] accent-[var(--color-primary)]"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className="p-3 text-sm text-[var(--color-text)]">
                      {col.render ? col.render(row[col.key], row, globalIndex) : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-3">
          <p className="text-xs text-[var(--color-text-dim)]">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  "h-8 min-w-8 rounded-md px-2 text-xs font-medium transition-colors",
                  page === i
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export { DataTable };
