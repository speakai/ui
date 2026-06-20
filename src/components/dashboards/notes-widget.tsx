/**
 * Notes widget body (presentational) — free-form annotation / section-header
 * text. No data fetch: renders the user's `config.heading` (optional) and
 * `config.content`, or an empty state when both are blank. Plain text with line
 * breaks preserved (no markdown).
 */

import { EmptyState } from "../EmptyState";
import { StickyNoteIcon } from "./icons";

export interface NotesConfig {
  heading?: string;
  content?: string;
}

export interface NotesLabels {
  emptyTitle: string;
  emptyDescription?: string;
}

export interface NotesWidgetProps {
  config?: NotesConfig;
  labels: NotesLabels;
}

export function NotesWidget({ config, labels }: NotesWidgetProps) {
  const trimmedHeading = config?.heading?.trim() ?? "";
  const trimmedContent = config?.content?.trim() ?? "";

  if (!trimmedHeading && !trimmedContent) {
    return (
      <EmptyState
        icon={<StickyNoteIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
        height="sm"
      />
    );
  }

  return (
    <div className="flex h-full flex-col gap-2 overflow-y-auto">
      {trimmedHeading ? (
        <h2 className="text-lg font-semibold text-foreground">{trimmedHeading}</h2>
      ) : null}
      {trimmedContent ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {trimmedContent}
        </p>
      ) : null}
    </div>
  );
}
