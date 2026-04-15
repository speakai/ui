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

export {
  createContextMenuPlugin,
  contextMenuPluginKey,
  getContextMenuState,
  hideContextMenu,
} from "./transcript/plugins/context-menu";
export type { ContextMenuState } from "./transcript/plugins/context-menu";

export { createMediaKeymapPlugin } from "./transcript/plugins/media-keymap";
export type { MediaKeymapCallbacks } from "./transcript/plugins/media-keymap";

export { createEditCommandsPlugin } from "./transcript/plugins/edit-commands";

export {
  createClipSelectionPlugin,
  clipSelectionPluginKey,
  setClipMode,
  updateClipDecorations,
  getClipTimesFromSelection,
} from "./transcript/plugins/clip-selection";
export type { ClipSegmentInput } from "./transcript/plugins/clip-selection";

export { extractSegmentsFromDoc } from "./transcript/utils/entities";
