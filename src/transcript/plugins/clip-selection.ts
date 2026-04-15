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

  // Track first position per segment for badge widget
  const segmentFirstPos = new Map<number, number | null>();
  for (const seg of segments) {
    segmentFirstPos.set(seg.order, null);
  }

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
          // Record first position for badge
          if (segmentFirstPos.get(seg.order) === null) {
            segmentFirstPos.set(seg.order, pos);
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
              if (segmentFirstPos.get(seg.order) === null) {
                segmentFirstPos.set(seg.order, pos);
              }
            }
          }
        }
      }
    }
  });

  // Add badge widgets at first highlighted position for each segment
  for (const seg of segments) {
    const firstPos = segmentFirstPos.get(seg.order);
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

  let minStart: number | null = null;
  let maxEnd: number | null = null;
  let text = "";

  view.state.doc.nodesBetween(from, to, (node: any) => {
    if (node.isText) {
      text += node.text ?? "";
    }
    // Check word mark attrs
    const wordMark = node.marks?.find((m: any) => m.type.name === "word");
    if (wordMark) {
      const s = wordMark.attrs.startInSec;
      const e = wordMark.attrs.endInSec;
      if (s != null && (minStart == null || Number(s) < minStart)) minStart = Number(s);
      if (e != null && (maxEnd == null || Number(e) > maxEnd)) maxEnd = Number(e);
    }
    // Check node attrs (for transcript_block or sentence nodes)
    if (node.attrs?.startInSec != null) {
      if (minStart == null || Number(node.attrs.startInSec) < minStart)
        minStart = Number(node.attrs.startInSec);
    }
    if (node.attrs?.endInSec != null) {
      if (maxEnd == null || Number(node.attrs.endInSec) > maxEnd)
        maxEnd = Number(node.attrs.endInSec);
    }
  });

  if (minStart == null || maxEnd == null) return null;
  return { start: minStart, end: maxEnd, text: text.trim() };
}
