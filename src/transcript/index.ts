/**
 * Transcript module — internal exports for TranscriptViewer and TranscriptEditor.
 *
 * These are NOT exported from the speak-ui public API directly.
 * They are used internally by the TranscriptViewer and TranscriptEditor components.
 */

// Schema
export { transcriptSchema } from "./schema";

// Plugins
export {
  createHighlightPlugin,
  highlightPluginKey,
  updateHighlightTime,
} from "./plugins/highlight";

export {
  createFindReplacePlugin,
  findReplacePluginKey,
  setSearchQuery,
  nextMatch,
  prevMatch,
  replaceCurrentMatch,
  replaceAllMatches,
  getMatchCount,
} from "./plugins/find-replace";

export {
  createSpeakerFilterPlugin,
  speakerFilterPluginKey,
  setSpeakerFilter,
} from "./plugins/speaker-filter";

// Utils
export { extractSegmentsFromDoc } from "./utils/entities";
