/**
 * Shared prop contracts for the presentational dashboard widgets.
 *
 * These widgets are pure render surfaces: every datum, config flag, and
 * user-facing string is injected. Both speak-client (TanStack) and
 * speak-media-library (fetch client) feed the SAME components through the
 * `DashboardWidgetView` dispatcher, so identical inputs produce identical output.
 *
 * Widget data shapes come from `@speakai/shared` (the wire contract). Each
 * widget defines its own `*Labels` and `*Config` types here.
 */

import type { DashboardWidgetType } from "@speakai/shared";

/**
 * The async envelope every data-backed widget receives. `data` is the
 * already-fetched, already-typed response (the matching `@speakai/shared`
 * `Public*Data` shape); the host app owns fetching, caching, and retry.
 */
export interface WidgetDataState<TData> {
  data: TData | undefined;
  isLoading: boolean;
  isError: boolean;
  /** Optional retry handler wired to the host's refetch; omit for no retry. */
  onRetry?: () => void;
}

/** Strings shared by every widget's uniform loading/error/empty handling. */
export interface WidgetCommonLabels {
  /** Error-state heading. */
  errorTitle?: string;
  /** Error-state message. */
  errorMessage?: string;
  /** Retry button label. */
  retryLabel?: string;
}

/** The 12 widget type literals, re-exported for dispatcher consumers. */
export type { DashboardWidgetType };
