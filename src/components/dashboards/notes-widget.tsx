/**
 * Notes widget body (presentational) — free-form annotation / section-header
 * text. No data fetch: renders the user's `config.heading` (optional) and
 * `config.content`, or an empty state when both are blank. Content is a safe
 * markdown subset (headings, emphasis, lists, quotes, rules, tables, links);
 * raw HTML is shown as text. Line breaks are preserved.
 */

import { EmptyState } from "../EmptyState";
import { StickyNoteIcon } from "./icons";
import { renderMarkdown } from "./markdown";

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
        <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          {renderMarkdown(trimmedContent)}
        </div>
      ) : null}
    </div>
  );
}
