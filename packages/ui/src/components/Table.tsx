import { forwardRef, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from "react";
import { cn } from "../utils/cn";

// ── Table ──────────────────────────────────────────────────────────────────────

export interface TableProps extends HTMLAttributes<HTMLTableElement> {}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, children, ...props }, ref) => (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
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

// ── TableHeader ────────────────────────────────────────────────────────────────

export interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className, ...props }, ref) => (
    <thead
      ref={ref}
      className={cn(
        "bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700",
        className
      )}
      {...props}
    />
  )
);
TableHeader.displayName = "TableHeader";

// ── TableBody ──────────────────────────────────────────────────────────────────

export interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn("divide-y divide-gray-200 dark:divide-gray-700", className)}
      {...props}
    />
  )
);
TableBody.displayName = "TableBody";

// ── TableRow ───────────────────────────────────────────────────────────────────

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  clickable?: boolean;
}

export const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className, clickable = false, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "bg-white dark:bg-gray-800 transition-all duration-200",
        clickable && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// ── TableHead ──────────────────────────────────────────────────────────────────

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
        className
      )}
      {...props}
    />
  )
);
TableHead.displayName = "TableHead";

// ── TableCell ──────────────────────────────────────────────────────────────────

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn(
        "px-4 py-3 text-sm text-gray-700 dark:text-gray-300",
        className
      )}
      {...props}
    />
  )
);
TableCell.displayName = "TableCell";

// ── TableSkeleton ──────────────────────────────────────────────────────────────

export interface TableSkeletonProps {
  columns?: number;
  rows?: number;
  className?: string;
}

export const TableSkeleton = ({ columns = 4, rows = 5, className }: TableSkeletonProps) => (
  <div className={cn("w-full overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700", className)}>
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <tr>
          {Array.from({ length: columns }).map((_, i) => (
            <th key={i} className="px-4 py-3">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <tr key={rowIdx} className="bg-white dark:bg-gray-800">
            {Array.from({ length: columns }).map((_, colIdx) => (
              <td key={colIdx} className="px-4 py-3">
                <div
                  className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
                  style={{ width: `${60 + Math.random() * 30}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
TableSkeleton.displayName = "TableSkeleton";
