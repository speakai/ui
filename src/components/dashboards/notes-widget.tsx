/**
 * Notes widget body (presentational) — free-form annotation / section-header
 * text. No data fetch: renders the user's `config.heading` (optional) and
 * `config.content`, or an empty state when both are blank. Content is a safe
 * markdown subset (headings, emphasis, lists, quotes, rules, tables, links);
 * raw HTML is shown as text. Line breaks are preserved.
 */

import { Button } from "../Button";
import { EmptyState } from "../EmptyState";
import { StickyNoteIcon } from "./icons";
import { renderMarkdown } from "./markdown";

export interface NotesAction {
  label: string;
  action: "openChat" | "goToSection";
  sectionId?: string;
}

export interface NotesConfig {
  heading?: string;
  content?: string;
  actions?: NotesAction[];
}

export interface NotesLabels {
  emptyTitle: string;
  emptyDescription?: string;
}

export interface NotesWidgetProps {
  config?: NotesConfig;
  labels: NotesLabels;
  onAction?: (action: NotesAction) => void;
}

export function NotesWidget({ config, labels, onAction }: NotesWidgetProps) {
  const trimmedHeading = config?.heading?.trim() ?? "";
  const trimmedContent = config?.content?.trim() ?? "";

  const actions = onAction ? (config?.actions ?? []).filter((a) => (a.label ?? "").trim() !== "") : [];

  if (!trimmedHeading && !trimmedContent && actions.length === 0) {
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
      {actions.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {actions.map((action, i) => (
            <Button
              key={`${action.action}-${action.sectionId ?? ""}-${i}`}
              type="button"
              size="sm"
              variant={i === 0 ? "primary" : "outline"}
              className="h-auto min-h-9 whitespace-normal py-2 text-start"
              onClick={() => onAction?.(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
