/**
 * ProseMirror plugin for active word/sentence highlighting.
 *
 * Takes the current playback time and applies decorations to:
 * 1. The active transcript_block (sentence-level highlight)
 * 2. The active word within that block (word-level highlight)
 *
 * Used by TranscriptViewer in static mode.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Transaction } from "prosemirror-state";

export const highlightPluginKey = new PluginKey("transcriptHighlight");

interface HighlightMeta {
  currentTime: number;
}

export function createHighlightPlugin() {
  return new Plugin({
    key: highlightPluginKey,
    state: {
      init() {
        return { currentTime: 0, decorations: DecorationSet.empty };
      },
      apply(tr: Transaction, value, _oldState, newState) {
        const meta = tr.getMeta(highlightPluginKey) as HighlightMeta | undefined;
        const currentTime = meta?.currentTime ?? value.currentTime;

        if (currentTime === value.currentTime && !meta) {
          return value;
        }

        const decorations: Decoration[] = [];

        newState.doc.descendants((node, pos) => {
          if (node.type.name === "transcript_block") {
            const start = parseFloat(node.attrs.startInSec || node.attrs.startTime || "0");
            const end = parseFloat(node.attrs.endInSec || node.attrs.endTime || "0");

            if (currentTime >= start && currentTime <= end) {
              // Highlight the active block
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: "transcript-block--active",
                })
              );
            }
          }

          // Word-level highlighting via marks
          if (node.type.name === "sentence") {
            node.forEach((child, childOffset) => {
              child.marks.forEach((mark) => {
                if (mark.type.name === "word") {
                  const wordStart = parseFloat(mark.attrs.startInSec || "0");
                  const wordEnd = parseFloat(mark.attrs.endInSec || "0");

                  if (currentTime >= wordStart && currentTime <= wordEnd) {
                    const from = pos + 1 + childOffset;
                    const to = from + child.nodeSize;
                    decorations.push(
                      Decoration.inline(from, to, {
                        class: "transcript-word--active",
                      })
                    );
                  }
                }
              });
            });
          }

          return true;
        });

        return {
          currentTime,
          decorations: DecorationSet.create(newState.doc, decorations),
        };
      },
    },
    props: {
      decorations(state) {
        return this.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

/**
 * Dispatch a time update to the highlight plugin.
 */
export function updateHighlightTime(
  view: import("prosemirror-view").EditorView,
  currentTime: number
) {
  const tr = view.state.tr.setMeta(highlightPluginKey, { currentTime });
  view.dispatch(tr);
}
