/**
 * Table widget body (presentational) — a spec-driven data table with client-side
 * sorting, optional search, per-cell threshold coloring, and optional row
 * navigation to a media item. Reuses the package Table primitives; all
 * user-facing strings are injected via `labels`.
 */

import { useMemo, useState } from "react";
import { cn } from "../../utils/cn";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableSortHead,
  TableEmpty,
  type SortDirection,
} from "../Table";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { BarChart3Icon } from "./icons";
import {
  resolveThresholdStatus,
  THRESHOLD_TEXT_CLASS,
  type SpecThreshold,
} from "./spec-thresholds";
import { formatCount, formatDurationHuman } from "./format";

// ── Data contract ────────────────────────────────────────────────────────────

export interface TableWidgetColumn {
  header: string;
  thresholds?: SpecThreshold[];
  format?: "number" | "duration";
}

export interface TableWidgetRow {
  name?: string;
  mediaId?: string;
  cells: (string | number | null)[];
}

export interface TableWidgetData {
  columns: TableWidgetColumn[];
  rows: TableWidgetRow[];
  total: number;
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface TableWidgetConfig {
  sort?: { column: string; dir: "asc" | "desc" };
  searchable?: boolean;
  rowClick?: "openMedia" | "none";
}

export interface TableWidgetLabels {
  title: string;
  empty: string;
  emptyDescription?: string;
  error: string;
  retry?: string;
  searchPlaceholder: string;
  nameHeader: string;
  totalCaption?: string;
}

export interface TableWidgetProps {
  data?: TableWidgetData;
  isLoading: boolean;
  isError: boolean;
  config: TableWidgetConfig;
  labels: TableWidgetLabels;
  onRowClick?: (mediaId: string) => void;
  onRetry?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const NAME_SORT_KEY = "name";

function columnSortKey(index: number): string {
  return `col-${index}`;
}

function cellText(cell: string | number | null): string {
  return cell == null ? "" : String(cell);
}

function compareCells(
  a: string | number | null,
  b: string | number | null,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

function formatCell(
  cell: string | number | null,
  format: TableWidgetColumn["format"],
): string {
  if (cell == null) return "—";
  if (typeof cell !== "number") return cell;
  return format === "duration" ? formatDurationHuman(cell) : formatCount(cell);
}

// ── Component ────────────────────────────────────────────────────────────────

export function TableWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRowClick,
  onRetry,
}: TableWidgetProps) {
  const columns = data?.columns ?? [];

  const initialSort = useMemo(() => {
    if (!config.sort) return null;
    const index = columns.findIndex((c) => c.header === config.sort?.column);
    if (index < 0) return null;
    return { key: columnSortKey(index), dir: config.sort.dir as SortDirection };
  }, [config.sort, columns]);

  // `null` until the user interacts with a header, so the sort derived from
  // freshly-loaded data (`initialSort`) is reflected on first paint. A lazy
  // useState initializer would capture the pre-data `null` and never re-sync.
  const [userSort, setUserSort] = useState<{
    key: string | null;
    dir: SortDirection;
  } | null>(null);
  const [search, setSearch] = useState("");

  const sortKey = userSort ? userSort.key : initialSort?.key ?? null;
  const sortDir = userSort ? userSort.dir : initialSort?.dir ?? null;

  const rows = data?.rows ?? [];
  const hasNameColumn = rows.some((row) => row.name != null);
  const clickable = config.rowClick === "openMedia" && !!onRowClick;

  const visibleRows = useMemo(() => {
    let result = rows;

    if (config.searchable && search.trim() !== "") {
      const query = search.trim().toLowerCase();
      result = result.filter(
        (row) =>
          (row.name ?? "").toLowerCase().includes(query) ||
          row.cells.some((cell) => cellText(cell).toLowerCase().includes(query)),
      );
    }

    if (sortKey && sortDir) {
      const direction = sortDir === "asc" ? 1 : -1;
      const colIndex = sortKey.startsWith("col-")
        ? Number(sortKey.slice(4))
        : null;
      result = [...result].sort((a, b) => {
        const cmp =
          colIndex == null
            ? compareCells(a.name ?? null, b.name ?? null)
            : compareCells(a.cells[colIndex] ?? null, b.cells[colIndex] ?? null);
        return cmp * direction;
      });
    }

    return result;
  }, [rows, config.searchable, search, sortKey, sortDir]);

  if (isLoading) {
    return <div className="h-80 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return (
      <WidgetError
        labels={{ errorTitle: labels.error, retryLabel: labels.retry }}
        onRetry={onRetry}
      />
    );
  }

  if (!data || rows.length === 0) {
    return (
      <WidgetEmpty
        icon={<BarChart3Icon className="h-10 w-10" />}
        title={labels.empty}
        description={labels.emptyDescription}
      />
    );
  }

  const handleSort = (key: string, direction: SortDirection) => {
    setUserSort({ key: direction ? key : null, dir: direction });
  };

  const columnCount = columns.length + (hasNameColumn ? 1 : 0);

  return (
    <div className="flex w-full flex-col gap-3">
      {config.searchable && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.searchPlaceholder}
          aria-label={labels.searchPlaceholder}
          className="h-9 w-full max-w-xs rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <Table aria-label={labels.title}>
        <TableHeader>
          <TableRow>
            {hasNameColumn && (
              <TableSortHead
                sortKey={NAME_SORT_KEY}
                activeSort={sortKey}
                direction={sortDir}
                onSort={handleSort}
              >
                {labels.nameHeader}
              </TableSortHead>
            )}
            {columns.map((column, i) => (
              <TableSortHead
                key={`${column.header}-${i}`}
                sortKey={columnSortKey(i)}
                activeSort={sortKey}
                direction={sortDir}
                onSort={handleSort}
              >
                {column.header}
              </TableSortHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.length === 0 ? (
            <TableEmpty colSpan={columnCount} title={labels.empty} />
          ) : (
            visibleRows.map((row, rowIndex) => {
              const rowClickable = clickable && !!row.mediaId;
              return (
                <TableRow
                  key={`${row.mediaId ?? row.name ?? ""}-${rowIndex}`}
                  clickable={rowClickable}
                  onClick={
                    rowClickable
                      ? () => onRowClick?.(row.mediaId as string)
                      : undefined
                  }
                >
                  {hasNameColumn && (
                    <TableCell className="font-medium text-foreground">
                      {row.name ?? "—"}
                    </TableCell>
                  )}
                  {columns.map((column, colIndex) => {
                    const cell = row.cells[colIndex] ?? null;
                    const match =
                      typeof cell === "number"
                        ? resolveThresholdStatus(cell, column.thresholds)
                        : null;
                    return (
                      <TableCell
                        key={colIndex}
                        className={cn(match && THRESHOLD_TEXT_CLASS[match.status])}
                      >
                        {formatCell(cell, column.format)}
                        {match?.label && (
                          <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {match.label}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      {labels.totalCaption && (
        <p className="text-xs text-muted-foreground">{labels.totalCaption}</p>
      )}
    </div>
  );
}
