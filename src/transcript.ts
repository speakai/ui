/**
 * @speakai/ui/transcript — ProseMirror schema, plugins, and utilities for transcript editing.
 *
 * Requires prosemirror peer deps. Separate entry to avoid forcing them on UI-only consumers.
 *
 *   import { transcriptSchema, createHighlightPlugin } from "@speakai/ui/transcript"
 */

export { transcriptSchema } from "./transcript/schema";

export {
  createHighlightPlugin,
  highlightPluginKey,
  updateHighlightTime,
} from "./transcript/plugins/highlight";

export {
  createFindReplacePlugin,
  findReplacePluginKey,
  setSearchQuery,
  nextMatch,
  prevMatch,
  replaceCurrentMatch,
  replaceAllMatches,
  getMatchCount,
} from "./transcript/plugins/find-replace";

export {
  createSpeakerFilterPlugin,
  speakerFilterPluginKey,
  setSpeakerFilter,
} from "./transcript/plugins/speaker-filter";

export { extractSegmentsFromDoc } from "./transcript/utils/entities";
