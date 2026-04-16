/**
 * ProseMirror plugin for media-playback keyboard shortcuts (F4–F10).
 *
 * Uses handleKeyDown instead of prosemirror-keymap because F-keys are not
 * supported by ProseMirror's built-in keymap normalization.
 */

import { Plugin } from "prosemirror-state";

export interface MediaKeymapCallbacks {
  onPlayPause(): void;
  onSpeedDown(): void;
  onSpeedUp(): void;
  onBack(): void;
  onForward(): void;
  onPause(): void;
  onResetSpeed(): void;
}

export function createMediaKeymapPlugin(callbacks: MediaKeymapCallbacks) {
  return new Plugin({
    props: {
      handleKeyDown(_view, event: KeyboardEvent) {
        const mod = event.metaKey || event.ctrlKey;

        // Cmd/Ctrl shortcuts (primary shortcuts matching Angular)
        if (mod) {
          switch (event.key.toLowerCase()) {
            case "k":
              event.preventDefault();
              callbacks.onPlayPause();
              return true;
            case "j":
              // Only handle when not in edit mode (edit-commands plugin has priority in editable views)
              event.preventDefault();
              callbacks.onBack();
              return true;
            case "l":
              event.preventDefault();
              callbacks.onForward();
              return true;
          }
        }

        // F-key shortcuts (kept for backward compatibility)
        switch (event.key) {
          case "F4":
            event.preventDefault();
            callbacks.onPlayPause();
            return true;
          case "F5":
            event.preventDefault();
            callbacks.onSpeedDown();
            return true;
          case "F6":
            event.preventDefault();
            callbacks.onSpeedUp();
            return true;
          case "F7":
            event.preventDefault();
            callbacks.onBack();
            return true;
          case "F8":
            event.preventDefault();
            callbacks.onForward();
            return true;
          case "F9":
            event.preventDefault();
            callbacks.onPause();
            return true;
          case "F10":
            event.preventDefault();
            callbacks.onResetSpeed();
            return true;
          default:
            return false;
        }
      },
    },
  });
}
