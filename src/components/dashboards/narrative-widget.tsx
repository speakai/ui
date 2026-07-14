/**
 * Narrative widget body (presentational) — an LLM-generated text summary.
 *
 * SECURITY: the text is model output served to anonymous public viewers. It is
 * rendered EXCLUSIVELY as React text nodes — paragraphs split on blank lines,
 * single newlines preserved via `whitespace-pre-line`. No HTML, no markdown,
 * no dangerouslySetInnerHTML — any markup in the text renders as literal text.
 *
 * When the text is absent or stale, an empty state shows with an optional
 * generate button (only when the host passes `onGenerate` — e.g. hidden in the
 * anonymous public view).
 */

import { Button } from "../Button";
import { EmptyState } from "../EmptyState";
import { MessageSquareIcon } from "./icons";

export interface NarrativeWidgetLabels {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  generate?: string;
  /** Pre-formatted "Generated on …" caption; shown verbatim when provided. */
  generatedAtCaption?: string;
  staleTitle?: string;
  staleDescription?: string;
}

export interface NarrativeWidgetProps {
  text?: string;
  /** ISO timestamp of the last generation; display comes from `generatedAtCaption`. */
  generatedAt?: string;
  isStale?: boolean;
  isGenerating?: boolean;
  onGenerate?: () => void;
  labels: NarrativeWidgetLabels;
}

export function NarrativeWidget({
  text,
  isStale,
  isGenerating,
  onGenerate,
  labels,
}: NarrativeWidgetProps) {
  const trimmed = text?.trim() ?? "";

  if (!trimmed || isStale) {
    return (
      <EmptyState
        icon={<MessageSquareIcon className="h-10 w-10" />}
        title={(isStale ? labels.staleTitle : undefined) ?? labels.emptyTitle}
        description={
          (isStale ? labels.staleDescription : undefined) ?? labels.emptyDescription
        }
        height="sm"
        action={
          onGenerate && labels.generate ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onGenerate}
              isLoading={isGenerating}
            >
              {labels.generate}
            </Button>
          ) : undefined
        }
      />
    );
  }

  const paragraphs = trimmed
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto">
      {paragraphs.map((paragraph, i) => (
        <p
          key={i}
          className="whitespace-pre-line text-sm leading-relaxed text-foreground"
        >
          {paragraph}
        </p>
      ))}
      {labels.generatedAtCaption && (
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {labels.generatedAtCaption}
        </p>
      )}
    </div>
  );
}
