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

export {
  createContextMenuPlugin,
  contextMenuPluginKey,
  getContextMenuState,
  hideContextMenu,
} from "./plugins/context-menu";
export type { ContextMenuState } from "./plugins/context-menu";

export { createMediaKeymapPlugin } from "./plugins/media-keymap";
export type { MediaKeymapCallbacks } from "./plugins/media-keymap";

export { createEditCommandsPlugin } from "./plugins/edit-commands";

export {
  createClipSelectionPlugin,
  clipSelectionPluginKey,
  setClipMode,
  updateClipDecorations,
  getClipTimesFromSelection,
} from "./plugins/clip-selection";
export type { ClipSegmentInput } from "./plugins/clip-selection";

// Utils
export { extractSegmentsFromDoc } from "./utils/entities";
