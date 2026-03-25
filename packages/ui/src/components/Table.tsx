import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "../utils/cn";

// ── Deterministic skeleton widths ────────────────────────────────────────────

const SKELETON_WIDTH_PATTERN = [75, 60, 85, 50, 70, 90, 55, 80, 65, 95];

function getSkeletonWidth(rowIndex: number, colIndex: number): string {
  const idx = (rowIndex * 7 + colIndex * 3) % SKELETON_WIDTH_PATTERN.length;
  return `${SKELETON_WIDTH_PATTERN[idx]}%`;
}

// ── Table ────────────────────────────────────────────────────────────────────

export interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-card">
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
        onClick?.(e as unknown as React.MouseEvent<HTMLTableRowElement>);
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
            "cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground",
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
        "px-4 py-3 text-sm text-card-foreground",
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
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      variant === "danger"
        ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
  className?: string;
}

export const TableSkeleton = forwardRef<HTMLDivElement, TableSkeletonProps>(
  ({ columns = 4, rows = 5, className }, ref) => (
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
              <th key={i} scope="col" className="px-4 py-3">
                <div className="h-3 w-20 animate-pulse rounded-lg bg-muted" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="bg-card">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3">
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
  )
);
TableSkeleton.displayName = "TableSkeleton";
