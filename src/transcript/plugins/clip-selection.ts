/**
 * ProseMirror plugin for clip segment decorations in the transcript.
 *
 * Manages visual highlighting of selected time ranges when clip mode is active.
 * Follows the same decoration pattern as find-replace.ts.
 */

import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { Transaction, EditorState } from "prosemirror-state";
import type { Node as PMNode } from "prosemirror-model";

export const clipSelectionPluginKey = new PluginKey<ClipSelectionState>("clipSelection");

export interface ClipSegmentInput {
  start: number;
  end: number;
  order: number;
}

interface ClipSelectionState {
  isClipMode: boolean;
  segments: ClipSegmentInput[];
  decorations: DecorationSet;
}

function overlaps(
  segStart: number,
  segEnd: number,
  nodeStart: number,
  nodeEnd: number
): boolean {
  return segStart < nodeEnd && segEnd > nodeStart;
}

function buildClipDecorations(
  doc: PMNode,
  segments: ClipSegmentInput[],
  isClipMode: boolean
): DecorationSet {
  if (!isClipMode || segments.length === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  // First highlighted position per segment, for the badge widget. A word
  // position wins over its enclosing block, which starts before the word.
  const segmentFirstWordPos = new Map<number, number>();
  const segmentFirstBlockPos = new Map<number, number>();

  doc.descendants((node, pos) => {
    // Try to get time attrs from the node itself (transcript_block / sentence nodes)
    const nodeStartTime: number | null =
      node.attrs?.startInSec != null ? Number(node.attrs.startInSec) : null;
    const nodeEndTime: number | null =
      node.attrs?.endInSec != null ? Number(node.attrs.endInSec) : null;

    if (nodeStartTime != null && nodeEndTime != null && !node.isText) {
      for (const seg of segments) {
        if (overlaps(seg.start, seg.end, nodeStartTime, nodeEndTime)) {
          decorations.push(
            Decoration.node(pos, pos + node.nodeSize, {
              class: "transcript-clip-selection--block",
            })
          );
          if (!segmentFirstBlockPos.has(seg.order)) {
            segmentFirstBlockPos.set(seg.order, pos);
          }
        }
      }
    }

    // Word-level marks: scan text nodes for "word" marks with time attrs
    if (node.isText && node.marks) {
      const wordMark = node.marks.find((m) => m.type.name === "word");
      if (wordMark) {
        const wStart = wordMark.attrs?.startInSec;
        const wEnd = wordMark.attrs?.endInSec;
        if (wStart != null && wEnd != null) {
          for (const seg of segments) {
            if (overlaps(seg.start, seg.end, Number(wStart), Number(wEnd))) {
              decorations.push(
                Decoration.inline(pos, pos + node.nodeSize, {
                  class: "transcript-clip-selection",
                })
              );
              if (!segmentFirstWordPos.has(seg.order)) {
                segmentFirstWordPos.set(seg.order, pos);
              }
            }
          }
        }
      }
    }
  });

  // Add badge widgets at first highlighted position for each segment
  for (const seg of segments) {
    const firstPos = segmentFirstWordPos.get(seg.order) ?? segmentFirstBlockPos.get(seg.order);
    if (firstPos != null) {
      const badge = document.createElement("span");
      badge.className = "transcript-clip-badge";
      badge.textContent = String(seg.order + 1);
      decorations.push(Decoration.widget(firstPos, badge, { side: -1 }));
    }
  }

  return DecorationSet.create(doc, decorations);
}

export function createClipSelectionPlugin() {
  return new Plugin<ClipSelectionState>({
    key: clipSelectionPluginKey,
    state: {
      init(_config: unknown, { doc }: EditorState): ClipSelectionState {
        return {
          isClipMode: false,
          segments: [],
          decorations: DecorationSet.empty,
        };
      },
      apply(
        tr: Transaction,
        value: ClipSelectionState,
        _oldState: EditorState,
        newState: EditorState
      ): ClipSelectionState {
        const meta = tr.getMeta(clipSelectionPluginKey) as Partial<ClipSelectionState> | undefined;
        if (!meta) {
          return {
            ...value,
            decorations: value.decorations.map(tr.mapping, tr.doc),
          };
        }
        const updated: ClipSelectionState = { ...value, ...meta };
        updated.decorations = buildClipDecorations(
          newState.doc,
          updated.segments,
          updated.isClipMode
        );
        return updated;
      },
    },
    props: {
      decorations(state) {
        return clipSelectionPluginKey.getState(state)?.decorations ?? DecorationSet.empty;
      },
    },
  });
}

// ── Public API ────────────────────────────────────────────────────

export function setClipMode(
  view: any,
  isActive: boolean,
  segments: ClipSegmentInput[]
) {
  view.dispatch(
    view.state.tr.setMeta(clipSelectionPluginKey, { isClipMode: isActive, segments })
  );
}

export function updateClipDecorations(
  view: any,
  segments: ClipSegmentInput[]
) {
  const current = clipSelectionPluginKey.getState(view.state);
  view.dispatch(
    view.state.tr.setMeta(clipSelectionPluginKey, {
      isClipMode: current?.isClipMode ?? false,
      segments,
    })
  );
}

export function getClipTimesFromSelection(
  view: any
): { start: number; end: number; text: string } | null {
  const { from, to, empty } = view.state.selection;
  if (empty) return null;

  // Word timings of the selected words, and as a fallback the times of the
  // enclosing transcript_block / sentence nodes (for text without word marks).
  const wordRange: { start: number | null; end: number | null } = { start: null, end: null };
  const nodeRange: { start: number | null; end: number | null } = { start: null, end: null };
  const widen = (range: typeof wordRange, start: unknown, end: unknown) => {
    if (start != null && (range.start == null || Number(start) < range.start)) range.start = Number(start);
    if (end != null && (range.end == null || Number(end) > range.end)) range.end = Number(end);
  };

  view.state.doc.nodesBetween(from, to, (node: any) => {
    const wordMark = node.marks?.find((m: any) => m.type.name === "word");
    if (wordMark) widen(wordRange, wordMark.attrs.startInSec, wordMark.attrs.endInSec);
    widen(nodeRange, node.attrs?.startInSec, node.attrs?.endInSec);
  });

  const range = wordRange.start != null && wordRange.end != null ? wordRange : nodeRange;
  if (range.start == null || range.end == null) return null;
  const text = view.state.doc.textBetween(from, to, " ").trim();
  return { start: range.start, end: range.end, text };
}
