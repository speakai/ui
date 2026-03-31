/**
 * @speakai/ui/media — MediaPlayer and media sync hook.
 *
 * Requires prosemirror peer deps. Separate entry to avoid forcing them on UI-only consumers.
 *
 *   import { MediaPlayer, useMediaSync } from "@speakai/ui/media"
 */

export { MediaPlayer } from "./components/MediaPlayer";
export type { MediaPlayerProps, MediaPlayerCaption } from "./components/MediaPlayer";

export { useMediaSync } from "./hooks/useMediaSync";
export type { UseMediaSyncReturn } from "./hooks/useMediaSync";
