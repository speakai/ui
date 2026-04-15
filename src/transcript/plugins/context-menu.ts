/**
 * ProseMirror plugin for right-click context menu in the transcript editor.
 *
 * Tracks selection state and pointer position so the React layer can render
 * a floating menu (copy, add-to-clip, remove-from-clip).
 */

import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export const contextMenuPluginKey = new PluginKey<ContextMenuState>("contextMenu");

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  hasSelection: boolean;
}

export function createContextMenuPlugin() {
  return new Plugin<ContextMenuState>({
    key: contextMenuPluginKey,
    state: {
      init(): ContextMenuState {
        return { visible: false, x: 0, y: 0, hasSelection: false };
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

          if (!hasSelection) {
            view.dispatch(
              view.state.tr.setMeta(contextMenuPluginKey, { visible: false })
            );
          } else {
            view.dispatch(
              view.state.tr.setMeta(contextMenuPluginKey, {
                visible: true,
                x: mouseEvent.clientX,
                y: mouseEvent.clientY,
                hasSelection: true,
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
  return (
    contextMenuPluginKey.getState(view.state) ?? {
      visible: false,
      x: 0,
      y: 0,
      hasSelection: false,
    }
  );
}

export function hideContextMenu(view: EditorView) {
  view.dispatch(
    view.state.tr.setMeta(contextMenuPluginKey, { visible: false })
  );
}
