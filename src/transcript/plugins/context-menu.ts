/**
 * ProseMirror plugin for right-click context menu in the transcript editor.
 *
 * Tracks selection state and pointer position so the React layer can render
 * a floating menu (copy, add-to-clip, remove-from-clip, remove label).
 *
 * mediaLabelIds lists the labels drawn under the selection, or under the pointer when
 * nothing is selected, so the menu can offer "Remove <label>". It is always empty
 * unless the labels plugin is installed and drawing labels.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { getMediaLabelsAt, getMediaLabelsInRange } from "./labels";

export const contextMenuPluginKey = new PluginKey<ContextMenuState>("contextMenu");

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  hasSelection: boolean;
  /** Labels under the selection or pointer; empty without the labels plugin */
  mediaLabelIds: string[];
}

const HIDDEN_STATE: ContextMenuState = { visible: false, x: 0, y: 0, hasSelection: false, mediaLabelIds: [] };

export function createContextMenuPlugin() {
  return new Plugin<ContextMenuState>({
    key: contextMenuPluginKey,
    state: {
      init(): ContextMenuState {
        return HIDDEN_STATE;
      },
      apply(tr, value): ContextMenuState {
        const meta = tr.getMeta(contextMenuPluginKey) as Partial<ContextMenuState> | undefined;
        if (meta) {
          return { ...value, ...meta };
        }
        return value;
      },
    },
    props: {
      handleDOMEvents: {
        contextmenu(view: EditorView, event: Event) {
          const mouseEvent = event as MouseEvent;
          mouseEvent.preventDefault();

          const { selection } = view.state;
          const hasSelection = !selection.empty;
          const mediaLabelIds = hasSelection
            ? getMediaLabelsInRange(view.state, selection.from, selection.to)
            : labelsAtPointer(view, mouseEvent);

          // Without a selection the menu opens only to offer removing the labels under the pointer
          if (!hasSelection && mediaLabelIds.length === 0) {
            view.dispatch(
              view.state.tr.setMeta(contextMenuPluginKey, { visible: false, mediaLabelIds: [] })
            );
          } else {
            view.dispatch(
              view.state.tr.setMeta(contextMenuPluginKey, {
                visible: true,
                x: mouseEvent.clientX,
                y: mouseEvent.clientY,
                hasSelection,
                mediaLabelIds,
              })
            );
          }

          return true;
        },
      },
    },
  });
}

export function getContextMenuState(view: EditorView): ContextMenuState {
  return contextMenuPluginKey.getState(view.state) ?? HIDDEN_STATE;
}

function labelsAtPointer(view: EditorView, event: MouseEvent): string[] {
  // posAtCoords needs layout; without it (or off the text) there is nothing under the pointer
  try {
    const hit = view.posAtCoords({ left: event.clientX, top: event.clientY });
    return hit ? getMediaLabelsAt(view.state, hit.pos) : [];
  } catch {
    return [];
  }
}

export function hideContextMenu(view: EditorView) {
  view.dispatch(
    view.state.tr.setMeta(contextMenuPluginKey, { visible: false })
  );
}
