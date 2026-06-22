/**
 * Media-list widget body (presentational) — a compact, paginated recent-media
 * table. The host owns pagination and date formatting and passes the page's
 * rows plus the total count; this body only renders.
 *
 * On the public share view the server confines rows to the dashboard's shared
 * folderScope; an optional `onRowClick` lets the host open each media's insight
 * view (the open is folderScope-gated server-side).
 */

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  TableEmpty,
  TablePagination,
} from "../Table";
import { WidgetError } from "./widget-states";
import { FileAudioIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

/** One already-formatted media row (the host formats the date string). */
export interface MediaListRow {
  id: string;
  name: string;
  type: string;
  /** Pre-formatted created date (e.g. "Jun 18, 2026"). */
  created: string;
}

export interface MediaListLabels extends WidgetCommonLabels {
  nameHeader: string;
  typeHeader: string;
  createdHeader: string;
  emptyTitle: string;
  emptyDescription?: string;
}

export interface MediaListWidgetProps {
  rows: MediaListRow[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  isError: boolean;
  labels: MediaListLabels;
  onRetry?: () => void;
  /**
   * When provided, each row becomes clickable and invokes this with the media
   * id — the host navigates to that media's insight view. Omit for a read-only
   * table.
   */
  onRowClick?: (id: string) => void;
}

export function MediaListWidget({
  rows,
  total,
  page,
  pageSize,
  onPageChange,
  isLoading,
  isError,
  labels,
  onRetry,
  onRowClick,
}: MediaListWidgetProps) {
  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  return (
    <div className="space-y-3">
      {isLoading ? (
        <TableSkeleton columns={3} rows={pageSize} />
      ) : (
        <Table scrollable>
          <TableHeader>
            <TableRow>
              <TableHead>{labels.nameHeader}</TableHead>
              <TableHead className="hidden sm:table-cell">{labels.typeHeader}</TableHead>
              <TableHead className="text-right">{labels.createdHeader}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableEmpty
                colSpan={3}
                icon={<FileAudioIcon className="h-8 w-8" />}
                title={labels.emptyTitle}
                description={labels.emptyDescription}
              />
            ) : (
              rows.map((item) => (
                <TableRow
                  key={item.id}
                  className={
                    onRowClick
                      ? "cursor-pointer transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                      : undefined
                  }
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? item.name : undefined}
                  onClick={onRowClick ? () => onRowClick(item.id) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onRowClick(item.id);
                          }
                        }
                      : undefined
                  }
                >
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {item.name}
                  </TableCell>
                  <TableCell className="hidden capitalize sm:table-cell text-muted-foreground">
                    {item.type}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {item.created}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {total > pageSize && (
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
