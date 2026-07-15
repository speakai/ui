/**
 * Placeholder shown on the public shared-dashboard view for widget types whose
 * data the server does not serve publicly (no public data path, or the data
 * carries PII/identity). Rendered read-only in place of the widget body so the
 * layout stays intact without any authed call. The host app decides which
 * types get the swap — the server's public widget surface owns that list.
 */

import { EmptyState } from "../EmptyState";
import { EyeOffIcon } from "./icons";

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
