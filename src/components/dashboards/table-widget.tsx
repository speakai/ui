/**
 * Table widget body (presentational) — a spec-driven data table with client-side
 * sorting, optional search, per-cell threshold coloring, and optional row
 * navigation to a media item. Reuses the package Table primitives; all
 * user-facing strings are injected via `labels`.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
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
import { Popover } from "../Popover";
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
  format?: "number" | "duration" | "percent";
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
  /** Rows shown per page before the pager appears. Defaults to 25. */
  pageSize?: number;
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
  /** Trigger label on clamped long-text cells. Defaults to "Read more". */
  readMore?: string;
  /** Pager: rows-per-page select label. Defaults to "Rows per page". */
  rowsPerPage?: string;
  /** Pager: previous-page button label. Defaults to "Previous page". */
  previousPage?: string;
  /** Pager: next-page button label. Defaults to "Next page". */
  nextPage?: string;
  /** Pager: range summary. Defaults to "{from}–{to} of {total}". */
  pageSummary?: (from: number, to: number, total: number) => string;
}

export interface TableWidgetProps {
  data?: TableWidgetData;
  isLoading: boolean;
  isError: boolean;
  config: TableWidgetConfig;
  labels: TableWidgetLabels;
  onRowClick?: (mediaId: string) => void;
  /** Group rows (rowsAre: "groups") become clickable and report the group's value, e.g. an Account ID. */
  onGroupRowClick?: (groupName: string) => void;
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

/**
 * Digit forms a phone-number search should match. Returns null when the query is not phone-like (fewer than six
 * digits, or letters mixed in), so ordinary text searches are untouched. A UK national number typed with its
 * leading 0 ("07799 036722") also matches the international form stored in the table ("+447799036722").
 */
export function phoneSearchForms(query: string): string[] | null {
  if (/[a-z]/i.test(query)) return null;
  const digits = query.replace(/\D/g, "");
  if (digits.length < 6) return null;
  const forms = [digits];
  if (digits.startsWith("0")) forms.push(`44${digits.slice(1)}`);
  if (digits.startsWith("44")) forms.push(`0${digits.slice(2)}`);
  return forms;
}

/** A row matches a search when any cell (or the row name) contains the text, or, for a phone-like query, its digits. */
export function rowMatchesSearch(name: string | null | undefined, cells: (string | number | null)[], rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (query === "") return true;
  const texts = [name ?? "", ...cells.map(cellText)];
  if (texts.some((t) => t.toLowerCase().includes(query))) return true;
  const forms = phoneSearchForms(query);
  if (!forms) return false;
  return texts.some((t) => {
    const d = t.replace(/\D/g, "");
    return d.length >= 6 && forms.some((f) => d.includes(f));
  });
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
  if (format === "duration") return formatDurationHuman(cell);
  if (format === "percent") return `${Math.round(cell * 100)}%`;
  return formatCount(cell);
}

/** Text cells longer than this clamp to a preview with a read-more popover. */
const LONG_TEXT_LIMIT = 140;
/** Text cells up to this length render on one line (dates, outcomes, stage names). */
const SHORT_TEXT_LIMIT = 24;

/** Rows per page when the config sets none. */
const DEFAULT_PAGE_SIZE = 25;

/** Page-size choices offered in the pager. */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function normalizePageSize(size: number | undefined): number {
  if (typeof size !== "number" || !Number.isFinite(size) || size < 1) return DEFAULT_PAGE_SIZE;
  return Math.floor(size);
}

/**
 * Horizontal scrollbar mirrored above a wide table. Wide codebook-style tables
 * otherwise only expose a scrollbar below the last row, which is off-screen
 * for any table taller than the viewport. The bar renders only while the
 * table overflows, and scroll position is kept in sync in both directions.
 */
function useMirroredScrollbar(tableRef: RefObject<HTMLTableElement | null>, revision: unknown) {
  const topRef = useRef<HTMLDivElement | null>(null);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [overflows, setOverflows] = useState(false);
  const syncing = useRef(false);

  const scrollContainer = useCallback(
    () => tableRef.current?.parentElement ?? null,
    [tableRef],
  );

  useEffect(() => {
    const table = tableRef.current;
    const container = scrollContainer();
    if (!table || !container) return;

    const measure = () => {
      setScrollWidth(table.scrollWidth);
      setOverflows(table.scrollWidth > container.clientWidth + 1);
    };
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(table);
    observer.observe(container);
    return () => observer.disconnect();
    // `revision` re-measures once the table mounts after loading and whenever
    // the rendered rows or columns change.
  }, [tableRef, scrollContainer, revision]);

  useEffect(() => {
    const container = scrollContainer();
    if (!container) return;
    const onScroll = () => {
      if (syncing.current || !topRef.current) return;
      syncing.current = true;
      topRef.current.scrollLeft = container.scrollLeft;
      syncing.current = false;
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [scrollContainer, overflows]);

  const onTopScroll = useCallback(() => {
    const container = scrollContainer();
    if (syncing.current || !container || !topRef.current) return;
    syncing.current = true;
    container.scrollLeft = topRef.current.scrollLeft;
    syncing.current = false;
  }, [scrollContainer]);

  return { topRef, scrollWidth, overflows, onTopScroll };
}

interface TablePagerProps {
  page: number;
  pageSize: number;
  total: number;
  labels: TableWidgetLabels;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

function TablePager({ page, pageSize, total, labels, onPageChange, onPageSizeChange }: TablePagerProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const summary = labels.pageSummary
    ? labels.pageSummary(from, to, total)
    : `${from}\u2013${to} of ${total}`;
  const buttonClass =
    "h-8 rounded-md border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring";
  const sizeOptions = PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? [...PAGE_SIZE_OPTIONS]
    : [...PAGE_SIZE_OPTIONS, pageSize].sort((a, b) => a - b);

  return (
    // Left-aligned on purpose: shared dashboards float a chat button in the
    // bottom-right corner, which would sit on top of right-aligned controls.
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
      <label className="flex items-center gap-2">
        <span>{labels.rowsPerPage ?? "Rows per page"}</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="h-8 rounded-md border border-border bg-background px-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
        >
          {sizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-2">
        <span aria-live="polite">{summary}</span>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0}
          aria-label={labels.previousPage ?? "Previous page"}
        >
          {"\u2039"}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount - 1}
          aria-label={labels.nextPage ?? "Next page"}
        >
          {"\u203a"}
        </button>
      </div>
    </div>
  );
}

/**
 * Clamped preview of a long text cell with the full text in a popover, so
 * narrative fields (briefs, summaries, coaching notes) keep table rows scannable.
 * The trigger stops click propagation so opening it never fires the row's
 * openMedia navigation.
 */
function LongTextCell({ text, readMoreLabel }: { text: string; readMoreLabel: string }) {
  return (
    <div className="min-w-[16rem] max-w-md">
      <span className="line-clamp-2 whitespace-pre-line">{text}</span>
      <span onClick={(e) => e.stopPropagation()}>
        <Popover
          side="bottom"
          align="start"
          trigger={
            <button
              type="button"
              className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              {readMoreLabel}
            </button>
          }
        >
          <div className="max-h-72 w-80 max-w-[80vw] overflow-y-auto whitespace-pre-line p-1 text-sm text-popover-foreground">
            {text}
          </div>
        </Popover>
      </span>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export function TableWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRowClick,
  onGroupRowClick,
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
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(() => normalizePageSize(config.pageSize));
  const tableRef = useRef<HTMLTableElement | null>(null);
  const { topRef, scrollWidth, overflows, onTopScroll } = useMirroredScrollbar(tableRef, data);

  const sortKey = userSort ? userSort.key : initialSort?.key ?? null;
  const sortDir = userSort ? userSort.dir : initialSort?.dir ?? null;

  const rows = data?.rows ?? [];
  const hasNameColumn = rows.some((row) => row.name != null);
  const clickable = config.rowClick === "openMedia" && !!onRowClick;

  const visibleRows = useMemo(() => {
    let result = rows;

    if (config.searchable && search.trim() !== "") {
      result = result.filter((row) => rowMatchesSearch(row.name, row.cells, search));
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

  // A new search, sort, page size or data set restarts from the first page so
  // the viewer never lands on a page that no longer exists.
  useEffect(() => {
    setPage(0);
  }, [search, sortKey, sortDir, pageSize, data?.rows]);

  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedRows = useMemo(
    () => visibleRows.slice(currentPage * pageSize, (currentPage + 1) * pageSize),
    [visibleRows, currentPage, pageSize],
  );
  const showPager = visibleRows.length > Math.min(pageSize, PAGE_SIZE_OPTIONS[0]);

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
      {overflows && (
        <div
          ref={topRef}
          onScroll={onTopScroll}
          className="scrollbar-visible w-full overflow-x-auto overflow-y-hidden"
          aria-hidden="true"
          data-testid="table-top-scrollbar"
        >
          <div style={{ width: scrollWidth, height: 1 }} />
        </div>
      )}
      <Table ref={tableRef} aria-label={labels.title}>
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
                <span className="whitespace-nowrap">{column.header}</span>
              </TableSortHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleRows.length === 0 ? (
            <TableEmpty colSpan={columnCount} title={labels.empty} />
          ) : (
            pagedRows.map((row, rowIndex) => {
              const groupClickable =
                !row.mediaId && row.name != null && !!onGroupRowClick;
              const rowClickable = (clickable && !!row.mediaId) || groupClickable;
              return (
                <TableRow
                  key={`${row.mediaId ?? row.name ?? ""}-${rowIndex}`}
                  clickable={rowClickable}
                  // Non-clickable rows keep a lighter hover so every dashboard
                  // table reads consistently, matching the app's media table.
                  className={rowClickable ? undefined : "hover:bg-muted/40"}
                  onClick={
                    rowClickable
                      ? () =>
                          row.mediaId
                            ? onRowClick?.(row.mediaId as string)
                            : onGroupRowClick?.(row.name as string)
                      : undefined
                  }
                >
                  {hasNameColumn && (
                    <TableCell className="whitespace-nowrap align-top font-medium text-foreground">
                      {row.name ?? "—"}
                    </TableCell>
                  )}
                  {columns.map((column, colIndex) => {
                    const cell = row.cells[colIndex] ?? null;
                    const match =
                      typeof cell === "number"
                        ? resolveThresholdStatus(cell, column.thresholds)
                        : null;
                    const formatted = formatCell(cell, column.format);
                    const isLongText =
                      typeof cell === "string" && cell.length > LONG_TEXT_LIMIT;
                    // Numbers, dates and short labels never wrap; medium text keeps a
                    // readable width so a two-word objection is not stacked three high.
                    const sizing =
                      typeof cell === "number" || (typeof cell === "string" && cell.length <= SHORT_TEXT_LIMIT)
                        ? "whitespace-nowrap"
                        : isLongText
                          ? undefined
                          : "min-w-[12rem]";
                    return (
                      <TableCell
                        key={colIndex}
                        className={cn("align-top", sizing, match && THRESHOLD_TEXT_CLASS[match.status])}
                      >
                        {isLongText ? (
                          <LongTextCell
                            text={formatted}
                            readMoreLabel={labels.readMore ?? "Read more"}
                          />
                        ) : (
                          formatted
                        )}
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
      {showPager && (
        <TablePager
          page={currentPage}
          pageSize={pageSize}
          total={visibleRows.length}
          labels={labels}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
      {labels.totalCaption && (
        <p className="text-xs text-muted-foreground">{labels.totalCaption}</p>
      )}
    </div>
  );
}
