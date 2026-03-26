import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  TdHTMLAttributes,
  ThHTMLAttributes,
  useCallback,
  useMemo,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Deterministic skeleton widths ────────────────────────────────────────────

const SKELETON_WIDTH_PATTERN = [75, 60, 85, 50, 70, 90, 55, 80, 65, 95];

function getSkeletonWidth(rowIndex: number, colIndex: number): string {
  const idx = (rowIndex * 7 + colIndex * 3) % SKELETON_WIDTH_PATTERN.length;
  return `${SKELETON_WIDTH_PATTERN[idx]}%`;
}

// ── Table ────────────────────────────────────────────────────────────────────

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  /** Set to false to disable horizontal scroll. Default true. */
  scrollable?: boolean;
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, scrollable = true, ...props }, ref) => (
    <div className={cn("w-full rounded-lg border border-border bg-card", scrollable ? "overflow-x-auto" : "overflow-hidden")}>
      <table
        ref={ref}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      >
        {children}
      </table>
    </div>
  )
);
Table.displayName = "Table";

// ── TableHeader ──────────────────────────────────────────────────────────────

export interface TableHeaderProps
  extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  TableHeaderProps
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("border-b border-border bg-muted/50", className)}
    {...props}
  />
));
TableHeader.displayName = "TableHeader";

// ── TableBody ────────────────────────────────────────────────────────────────

export interface TableBodyProps
  extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("divide-y divide-border", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

// ── TableRow ─────────────────────────────────────────────────────────────────

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable = false, onClick, ...props }, ref) => {
    const handleKeyDown = (e: KeyboardEvent<HTMLTableRowElement>) => {
      if (clickable && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        (e.currentTarget as HTMLElement).click();
      }
      props.onKeyDown?.(e);
    };

    return (
      <tr
        ref={ref}
        role="row"
        tabIndex={clickable ? 0 : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "bg-card transition-colors",
          clickable &&
            "cursor-pointer hover:bg-muted/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      />
    );
  }
);
TableRow.displayName = "TableRow";

// ── TableHead ────────────────────────────────────────────────────────────────

export interface TableHeadProps
  extends ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      scope="col"
      className={cn(
        "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

// ── TableCell ────────────────────────────────────────────────────────────────

export interface TableCellProps
  extends TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-6 py-4 text-sm text-card-foreground",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// ── TableActions (inline row actions) ───────────────────────────────────────

export interface TableActionsProps extends HTMLAttributes<HTMLDivElement> {}

export const TableActions = forwardRef<HTMLDivElement, TableActionsProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-end gap-1",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      {...props}
    >
      {children}
    </div>
  )
);
TableActions.displayName = "TableActions";

// ── TableActionButton (small icon buttons for rows) ─────────────────────────

export interface TableActionButtonProps
  extends HTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: "default" | "danger";
}

export const TableActionButton = forwardRef<
  HTMLButtonElement,
  TableActionButtonProps
>(({ className, label, variant = "default", children, ...props }, ref) => (
  <button
    ref={ref}
    aria-label={label}
    className={cn(
      "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
      variant === "danger"
        ? "text-muted-foreground hover:bg-danger/10 hover:text-danger"
        : "text-muted-foreground hover:bg-muted hover:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
TableActionButton.displayName = "TableActionButton";

// ── TableSkeleton ────────────────────────────────────────────────────────────

export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  /** Height of each skeleton row (e.g. "h-16"). When provided, renders simple bar rows instead of column cells. */
  rowHeight?: string;
  className?: string;
}

export const TableSkeleton = forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ columns = 4, rows = 5, rowHeight, className }, ref) => {
    // Simple bar mode (voice-agent-client compat)
    if (rowHeight) {
      return (
        <div
          ref={ref}
          className={cn(
            "w-full overflow-hidden rounded-lg border border-border bg-card",
            className
          )}
        >
          <div className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, i) => (
              <div key={i} className={cn(rowHeight, "animate-pulse bg-muted/30")} />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full overflow-x-auto rounded-lg border border-border bg-card",
          className
        )}
      >
        <table className="w-full">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} scope="col" className="px-6 py-3">
                  <div className="h-3 w-20 animate-pulse rounded-lg bg-muted" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <tr key={rowIdx} className="bg-card">
                {Array.from({ length: columns }).map((_, colIdx) => (
                  <td key={colIdx} className="px-6 py-4">
                    <div
                      className="h-4 animate-pulse rounded-lg bg-muted"
                      style={{ width: getSkeletonWidth(rowIdx, colIdx) }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
);
TableSkeleton.displayName = "TableSkeleton";

// ── TableSortHead (sortable column header) ──────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface TableSortHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortKey: string;
  activeSort?: string | null;
  direction?: SortDirection;
  onSort?: (key: string, direction: SortDirection) => void;
}

export const TableSortHead = forwardRef<HTMLTableCellElement, TableSortHeadProps>(
  ({ sortKey, activeSort, direction, onSort, className, children, ...props }, ref) => {
    const isActive = activeSort === sortKey;

    const handleClick = () => {
      if (!onSort) return;
      let next: SortDirection;
      if (!isActive) {
        next = "asc";
      } else if (direction === "asc") {
        next = "desc";
      } else {
        next = null;
      }
      onSort(sortKey, next);
    };

    return (
      <th
        ref={ref}
        scope="col"
        className={cn(
          "px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
          onSort && "cursor-pointer select-none transition-colors hover:text-foreground",
          className
        )}
        onClick={handleClick}
        aria-sort={isActive ? (direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none") : undefined}
        {...props}
      >
        <span className="inline-flex items-center gap-1">
          {children}
          {onSort && (
            <span className={cn("inline-flex flex-col -space-y-1", !isActive && "opacity-30")} aria-hidden="true">
              <svg className={cn("h-3 w-3", isActive && direction === "asc" ? "text-foreground" : "text-muted-foreground/50")} viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 4l4 5H4l4-5z" />
              </svg>
              <svg className={cn("h-3 w-3", isActive && direction === "desc" ? "text-foreground" : "text-muted-foreground/50")} viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 12l4-5H4l4 5z" />
              </svg>
            </span>
          )}
        </span>
      </th>
    );
  }
);
TableSortHead.displayName = "TableSortHead";

// ── TablePagination ─────────────────────────────────────────────────────────

export interface TablePaginationProps extends HTMLAttributes<HTMLDivElement> {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const TablePagination = forwardRef<HTMLDivElement, TablePaginationProps>(
  (
    {
      page,
      pageSize,
      total,
      onPageChange,
      onPageSizeChange,
      pageSizeOptions = [10, 25, 50, 100],
      className,
      ...props
    },
    ref
  ) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = Math.min((page - 1) * pageSize + 1, total);
    const end = Math.min(page * pageSize, total);
    const hasPrev = page > 1;
    const hasNext = page < totalPages;

    // Generate page numbers to show
    const getPageNumbers = (): (number | "...")[] => {
      if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

      const pages: (number | "...")[] = [1];
      if (page > 3) pages.push("...");

      const rangeStart = Math.max(2, page - 1);
      const rangeEnd = Math.min(totalPages - 1, page + 1);
      for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);

      if (page < totalPages - 2) pages.push("...");
      pages.push(totalPages);

      return pages;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
        {...props}
      >
        {/* Left: info + page size */}
        <div className="flex items-center gap-4">
          <p className="text-xs text-muted-foreground whitespace-nowrap">
            {total === 0 ? "No results" : `${start}-${end} of ${total}`}
          </p>
          {onPageSizeChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="w-16 rounded-md border border-border bg-background py-1 px-2 text-xs text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
              >
                {pageSizeOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right: page buttons */}
        <div className="flex items-center gap-1">
          {/* Prev */}
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={!hasPrev}
            aria-label="Previous page"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              hasPrev
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "pointer-events-none text-muted-foreground/30"
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Page numbers */}
          {getPageNumbers().map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-muted-foreground">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                  p === page
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {p}
              </button>
            )
          )}

          {/* Next */}
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={!hasNext}
            aria-label="Next page"
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
              hasNext
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "pointer-events-none text-muted-foreground/30"
            )}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      </div>
    );
  }
);
TablePagination.displayName = "TablePagination";

// ── TableEmpty (empty state row) ──────────────────────────────────────────────

export interface TableEmptyProps extends HTMLAttributes<HTMLTableRowElement> {
  colSpan: number;
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export const TableEmpty = forwardRef<HTMLTableRowElement, TableEmptyProps>(
  (
    {
      colSpan,
      icon,
      title = "No results",
      description,
      action,
      className,
      ...props
    },
    ref
  ) => (
    <tr ref={ref} className={className} {...props}>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center gap-3">
          {icon && (
            <div className="text-muted-foreground/50">{icon}</div>
          )}
          {title && (
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
          )}
          {description && (
            <p className="max-w-sm text-xs text-muted-foreground/70">
              {description}
            </p>
          )}
          {action && <div className="mt-1">{action}</div>}
        </div>
      </td>
    </tr>
  )
);
TableEmpty.displayName = "TableEmpty";

// ── useSort (sort state hook) ────────────────────────────────────────────────

export function useSort<T>(
  data: T[],
  sortFn?: (a: T, b: T, key: string, dir: SortDirection) => number
) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const onSort = useCallback((key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null);
    setSortDir(direction);
  }, []);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDir || !sortFn) return data;
    return [...data].sort((a, b) => sortFn(a, b, sortKey, sortDir));
  }, [data, sortKey, sortDir, sortFn]);

  return { sortKey, sortDir, onSort, sortedData } as const;
}
