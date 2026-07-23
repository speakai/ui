/**
 * ProseMirror plugin for find & replace in transcripts.
 *
 * Manages search state, decorations for matches, and navigation between matches.
 * Used by TranscriptEditor when findReplaceEnabled is true.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Transaction, EditorState } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import type { Node as PMNode } from "prosemirror-model";

export const findReplacePluginKey = new PluginKey("findReplace");

interface FindReplacePluginState {
  searchQuery: string;
  caseSensitive: boolean;
  useRegex: boolean;
  matches: Array<{ from: number; to: number }>;
  currentMatchIndex: number;
  decorations: DecorationSet;
}

interface FindReplaceMeta {
  searchQuery?: string;
  caseSensitive?: boolean;
  useRegex?: boolean;
  currentMatchIndex?: number;
}

/**
 * A textblock's inline text flattened into one string, with the map needed to
 * translate an offset in that string back to a document position.
 */
interface FlatBlock {
  text: string;
  runs: Array<{ flatStart: number; docPos: number; length: number }>;
}

function flattenTextblock(node: PMNode, blockPos: number): FlatBlock {
  let text = "";
  const runs: FlatBlock["runs"] = [];
  node.forEach((child, offset) => {
    if (child.isText && child.text) {
      runs.push({ flatStart: text.length, docPos: blockPos + 1 + offset, length: child.text.length });
      text += child.text;
    }
  });
  return { text, runs };
}

/** Map an offset in the flattened string back to a document position. */
function flatOffsetToDocPos({ runs }: FlatBlock, offset: number): number | null {
  for (const run of runs) {
    if (offset >= run.flatStart && offset <= run.flatStart + run.length) {
      return run.docPos + (offset - run.flatStart);
    }
  }
  return null;
}

/**
 * Find every match of `query` in the document.
 *
 * Each transcript word is its own text node, so a multi-word phrase spans
 * several nodes. Matching is done against each textblock's flattened text and
 * mapped back to document positions; searching node-by-node would only ever
 * match within a single word.
 */
function findMatches(
  doc: PMNode,
  query: string,
  caseSensitive: boolean,
  useRegex = false
): Array<{ from: number; to: number }> {
  if (!query || query.length < 2) return [];

  const matches: Array<{ from: number; to: number }> = [];

  let regex: RegExp | null = null;
  if (useRegex) {
    try {
      regex = new RegExp(query, caseSensitive ? "g" : "gi");
    } catch {
      return [];
    }
  }
  const searchStr = caseSensitive ? query : query.toLowerCase();

  const pushMatch = (block: FlatBlock, start: number, end: number) => {
    const from = flatOffsetToDocPos(block, start);
    const to = flatOffsetToDocPos(block, end);
    if (from != null && to != null && to > from) matches.push({ from, to });
  };

  doc.descendants((node, pos) => {
    if (!node.isTextblock) return true;

    const block = flattenTextblock(node, pos);
    if (!block.text) return false;

    if (regex) {
      regex.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = regex.exec(block.text)) !== null) {
        if (match.index === regex.lastIndex) regex.lastIndex++;
        if (match[0].length > 0) pushMatch(block, match.index, match.index + match[0].length);
      }
    } else {
      const haystack = caseSensitive ? block.text : block.text.toLowerCase();
      let index = haystack.indexOf(searchStr);
      while (index !== -1) {
        pushMatch(block, index, index + searchStr.length);
        index = haystack.indexOf(searchStr, index + 1);
      }
    }

    // Textblock content is already covered by the flattened scan.
    return false;
  });

  return matches;
}

/** Exposed for unit tests; not part of the public plugin surface. */
export const findMatchesForTest = findMatches;

function buildDecorations(
  doc: PMNode,
  matches: Array<{ from: number; to: number }>,
  currentIndex: number
): DecorationSet {
  if (matches.length === 0) return DecorationSet.empty;

  const decorations = matches.map((match, i) =>
    Decoration.inline(match.from, match.to, {
      class:
        i === currentIndex
          ? "transcript-search-match transcript-search-match--current"
          : "transcript-search-match",
    })
  );

  return DecorationSet.create(doc, decorations);
}

export function createFindReplacePlugin() {
  return new Plugin({
    key: findReplacePluginKey,
    state: {
      init(): FindReplacePluginState {
        return {
          searchQuery: "",
          caseSensitive: false,
          useRegex: false,
          matches: [],
          currentMatchIndex: -1,
          decorations: DecorationSet.empty,
        };
      },
      apply(
        tr: Transaction,
        value: FindReplacePluginState,
        _oldState: EditorState,
        newState: EditorState
      ): FindReplacePluginState {
        const meta = tr.getMeta(findReplacePluginKey) as FindReplaceMeta | undefined;

        if (!meta) {
          // If doc changed, remap decorations
          if (tr.docChanged) {
            const matches = findMatches(
              newState.doc,
              value.searchQuery,
              value.caseSensitive,
              value.useRegex
            );
            const currentIndex = Math.min(
              value.currentMatchIndex,
              matches.length - 1
            );
            return {
              ...value,
              matches,
              currentMatchIndex: currentIndex >= 0 ? currentIndex : -1,
              decorations: buildDecorations(newState.doc, matches, currentIndex),
            };
          }
          return value;
        }

        const searchQuery = meta.searchQuery ?? value.searchQuery;
        const caseSensitive = meta.caseSensitive ?? value.caseSensitive;
        const useRegex = meta.useRegex ?? value.useRegex;

        // Recalculate matches if query changed
        const queryChanged =
          searchQuery !== value.searchQuery ||
          caseSensitive !== value.caseSensitive ||
          useRegex !== value.useRegex;

        const matches = queryChanged
          ? findMatches(newState.doc, searchQuery, caseSensitive, useRegex)
          : value.matches;

        let currentIndex =
          meta.currentMatchIndex ?? (queryChanged ? 0 : value.currentMatchIndex);
        if (matches.length === 0) currentIndex = -1;
        else if (currentIndex >= matches.length) currentIndex = 0;
        else if (currentIndex < 0) currentIndex = matches.length - 1;

        return {
          searchQuery,
          caseSensitive,
          useRegex,
          matches,
          currentMatchIndex: currentIndex,
          decorations: buildDecorations(newState.doc, matches, currentIndex),
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

// ── Public API ────────────────────────────────────────────────────

export function setSearchQuery(
  view: EditorView,
  query: string,
  caseSensitive = false,
  useRegex = false
) {
  view.dispatch(
    view.state.tr.setMeta(findReplacePluginKey, {
      searchQuery: query,
      caseSensitive,
      useRegex,
    })
  );
}

export function nextMatch(view: EditorView) {
  const state = findReplacePluginKey.getState(view.state) as FindReplacePluginState | undefined;
  if (!state || state.matches.length === 0) return;

  const next = (state.currentMatchIndex + 1) % state.matches.length;
  view.dispatch(
    view.state.tr.setMeta(findReplacePluginKey, { currentMatchIndex: next })
  );

  // Scroll to the current match
  const match = state.matches[next];
  if (match) {
    const dom = view.domAtPos(match.from);
    if (dom.node instanceof HTMLElement) {
      dom.node.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
}

export function prevMatch(view: EditorView) {
  const state = findReplacePluginKey.getState(view.state) as FindReplacePluginState | undefined;
  if (!state || state.matches.length === 0) return;

  const prev =
    (state.currentMatchIndex - 1 + state.matches.length) %
    state.matches.length;
  view.dispatch(
    view.state.tr.setMeta(findReplacePluginKey, { currentMatchIndex: prev })
  );
}

/**
 * Replacement text inheriting the marks of the text it replaces.
 *
 * Word marks carry per-word timings and are the only source `extractWordEntities`
 * reads, so unmarked replacement text silently deletes that word's timing on save.
 */
function markedReplacement(view: EditorView, from: number, replacement: string) {
  const marks = view.state.doc.nodeAt(from)?.marks ?? [];
  return view.state.schema.text(replacement, marks);
}

export function replaceCurrentMatch(view: EditorView, replacement: string) {
  const state = findReplacePluginKey.getState(view.state) as FindReplacePluginState | undefined;
  if (!state || state.currentMatchIndex < 0) return;

  const match = state.matches[state.currentMatchIndex];
  if (!match) return;

  const tr = view.state.tr.replaceWith(
    match.from,
    match.to,
    markedReplacement(view, match.from, replacement)
  );
  view.dispatch(tr);
}

export function replaceAllMatches(view: EditorView, replacement: string) {
  const state = findReplacePluginKey.getState(view.state) as FindReplacePluginState | undefined;
  if (!state || state.matches.length === 0) return;

  // Replace from end to start to preserve positions
  let tr = view.state.tr;
  const sortedMatches = [...state.matches].sort((a, b) => b.from - a.from);

  for (const match of sortedMatches) {
    tr = tr.replaceWith(match.from, match.to, markedReplacement(view, match.from, replacement));
  }

  view.dispatch(tr);
}

export function getMatchCount(view: EditorView): {
  count: number;
  currentIndex: number;
} {
  const state = findReplacePluginKey.getState(view.state) as FindReplacePluginState | undefined;
  return {
    count: state?.matches.length ?? 0,
    currentIndex: state?.currentMatchIndex ?? -1,
  };
}
