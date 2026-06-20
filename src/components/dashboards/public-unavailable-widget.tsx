/**
 * Placeholder shown on the public shared-dashboard view for widget types whose
 * data the server does not serve publicly (media-list, team-activity, people,
 * notes carry PII/identity or have no public data path). Rendered read-only in
 * place of the widget body so the layout stays intact without any authed call.
 */

import { EmptyState } from "../EmptyState";
import { EyeOffIcon } from "./icons";
import type { DashboardWidgetType } from "@speakai/shared";

/**
 * Widget types whose data the server does NOT serve on the public share endpoint.
 * Single source of truth for the dispatcher's public-view placeholder swap.
 */
export const PUBLIC_UNAVAILABLE_TYPES: ReadonlySet<DashboardWidgetType> =
  new Set<DashboardWidgetType>(["media-list", "team-activity", "people", "notes"]);

export interface PublicUnavailableLabels {
  title: string;
  description?: string;
}

export function PublicUnavailableWidget({ labels }: { labels: PublicUnavailableLabels }) {
  return (
    <EmptyState
      icon={<EyeOffIcon className="h-10 w-10" />}
      title={labels.title}
      description={labels.description}
      height="sm"
    />
  );
}
