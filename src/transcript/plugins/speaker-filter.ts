/**
 * ProseMirror plugin for filtering transcript by speaker.
 *
 * Applies CSS decorations to hide/show paragraph_container nodes
 * based on a set of filtered speaker IDs.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Transaction, EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

export const speakerFilterPluginKey = new PluginKey("speakerFilter");

interface SpeakerFilterState {
  filteredSpeakers: Set<string>;
  decorations: DecorationSet;
}

interface SpeakerFilterMeta {
  filteredSpeakers: Set<string>;
}

export function createSpeakerFilterPlugin() {
  return new Plugin({
    key: speakerFilterPluginKey,
    state: {
      init(): SpeakerFilterState {
        return {
          filteredSpeakers: new Set(),
          decorations: DecorationSet.empty,
        };
      },
      apply(
        tr: Transaction,
        value: SpeakerFilterState,
        _oldState: EditorState,
        newState: EditorState
      ): SpeakerFilterState {
        const meta = tr.getMeta(speakerFilterPluginKey) as SpeakerFilterMeta | undefined;
        const filteredSpeakers = meta?.filteredSpeakers ?? value.filteredSpeakers;

        if (filteredSpeakers === value.filteredSpeakers && !meta && !tr.docChanged) {
          return value;
        }

        if (filteredSpeakers.size === 0) {
          return {
            filteredSpeakers,
            decorations: DecorationSet.empty,
          };
        }

        const decorations: Decoration[] = [];

        newState.doc.descendants((node, pos) => {
          if (node.type.name === "paragraph_container") {
            const speakerId = String(node.attrs.speakerId);
            if (!filteredSpeakers.has(speakerId)) {
              // Hide paragraphs NOT in the filter set
              decorations.push(
                Decoration.node(pos, pos + node.nodeSize, {
                  class: "transcript-paragraph--hidden",
                  style: "display: none;",
                })
              );
            }
            return false; // Don't descend into hidden paragraphs
          }
          return true;
        });

        return {
          filteredSpeakers,
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
 * Set the speaker filter. Pass an empty set to show all speakers.
 */
export function setSpeakerFilter(
  view: EditorView,
  speakerIds: Set<string>
) {
  view.dispatch(
    view.state.tr.setMeta(speakerFilterPluginKey, {
      filteredSpeakers: speakerIds,
    })
  );
}
