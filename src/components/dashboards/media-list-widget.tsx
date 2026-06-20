/**
 * Media-list widget body (presentational) — a compact, paginated recent-media
 * table. The host owns pagination and date formatting and passes the page's
 * rows plus the total count; this body only renders.
 *
 * Media carries identity, so the server does NOT serve it on the public share
 * endpoint — the dispatcher renders the unavailable placeholder there.
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
                <TableRow key={item.id}>
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
