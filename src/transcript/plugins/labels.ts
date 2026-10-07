/** Labels plugin: decorations in view mode, anchor marks in edit mode; anchors are inclusive word positions counted like flattenWords() in @speakai/shared. */

import { Plugin, PluginKey } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import type { EditorView } from "prosemirror-view";
import { Fragment, Slice } from "prosemirror-model";
import type { MarkType, Node as PMNode } from "prosemirror-model";
import { AnchorStatus } from "@speakai/shared";
import type { ILabel, IMediaLabel } from "@speakai/shared";
import { firstWordEndingAfter, getWordIndex, wordRangeBetween } from "../utils/word-index";
import type { WordIndex } from "../utils/word-index";

/** Most stripe colours exposed per block; the rest are reported as an overflow count ("+N"). */
export const MAX_LABEL_STRIPES = 4;

/** Applied to the first label's colour. */
const LABEL_TINT_ALPHA = 0.16;

// Colours go into a style attribute, so only plain #rrggbb is accepted
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** DOM contract for the client; id lists are space separated so CSS `~=` selectors work. */
export const LABEL_DOM = {
  /** Inline decoration on a labelled passage (one per colour block). */
  runClass: "transcript-label",
  /** Node decoration class on a transcript_block that any visible label touches. */
  blockClass: "transcript-block--labelled",
  /** Mark class on anchor spans in edit mode. */
  anchorClass: "transcript-anchor",
  mediaLabelIdsAttr: "data-media-label-ids",
  labelIdsAttr: "data-label-ids",
  /** Block only: up to MAX_LABEL_STRIPES colours, space separated, in label order. */
  colorsAttr: "data-label-colors",
  /** Block only: number of distinct visible labels touching the block. */
  countAttr: "data-label-count",
  /** Block only: labels beyond MAX_LABEL_STRIPES, present only when above 0. */
  overflowAttr: "data-label-overflow",
} as const;

// Marks our decorations so lookups never pick up other plugins' decorations
const SPEC_KEY = "transcriptLabel";

export interface SetLabelsPayload {
  mediaLabels: IMediaLabel[];
  labels: ILabel[];
  /** The caller expands hidden groups into child label ids; the plugin does not walk parentId. */
  hiddenLabelIds: string[];
  visible: boolean;
}

export type LabelsPluginOptions = Partial<SetLabelsPayload>;

export interface WordRange {
  /** First word position, inclusive */
  start: number;
  /** Last word position, inclusive */
  end: number;
}

export interface MappedAnchor extends WordRange {
  mediaLabelId: string;
}

interface DrawnLabel {
  labelId: string;
  color: string;
}

/** A media label that is drawn: its clamped word range and its visible labels. */
interface LabelEntry extends WordRange {
  mediaLabelId: string;
  labels: DrawnLabel[];
}

export interface LabelsPluginState {
  visible: boolean;
  editMode: boolean;
  mediaLabels: ReadonlyMap<string, IMediaLabel>;
  labels: ReadonlyMap<string, ILabel>;
  hiddenLabelIds: ReadonlySet<string>;
  /** Drawn media labels only (status, archive, hidden and range already filtered) */
  entries: ReadonlyMap<string, LabelEntry>;
  decorations: DecorationSet;
}

type LabelsAction =
  | { type: "set"; payload: SetLabelsPayload }
  | { type: "upsert"; mediaLabel: IMediaLabel; labels: ILabel[] }
  | { type: "remove"; mediaLabelId: string }
  | { type: "editMode"; editMode: boolean };

interface DecoSpec {
  [SPEC_KEY]: "run" | "block";
  mediaLabelIds: string[];
}

export const labelsPluginKey = new PluginKey<LabelsPluginState>("labels");

/** Options seed the first render; later changes go through setLabels() and the single-label helpers. */
export function createLabelsPlugin(options: LabelsPluginOptions = {}) {
  return new Plugin<LabelsPluginState>({
    key: labelsPluginKey,
    state: {
      init(_config, state: EditorState): LabelsPluginState {
        return setState(state.doc, false, {
          mediaLabels: options.mediaLabels ?? [],
          labels: options.labels ?? [],
          hiddenLabelIds: options.hiddenLabelIds ?? [],
          visible: options.visible ?? true,
        });
      },
      apply(tr, prev, _oldState, newState): LabelsPluginState {
        // Mapping keeps drawn labels on their text until the caller sends re-anchored labels
        const state = tr.docChanged
          ? { ...prev, decorations: prev.decorations.map(tr.mapping, tr.doc) }
          : prev;
        const action = tr.getMeta(labelsPluginKey) as LabelsAction | undefined;
        if (!action) return state;

        switch (action.type) {
          case "set":
            return setState(newState.doc, state.editMode, action.payload);
          case "upsert":
            return upsertMediaLabel(state, newState.doc, action.mediaLabel, action.labels);
          case "remove":
            return removeEntry(state, newState.doc, action.mediaLabelId);
          case "editMode":
            return { ...state, editMode: action.editMode };
        }
      },
    },
    props: {
      decorations(state) {
        const pluginState = labelsPluginKey.getState(state);
        if (!pluginState || pluginState.editMode) return DecorationSet.empty;
        return pluginState.decorations;
      },
      // Pasted or dropped text must not carry another passage's anchor, or the label would stretch to it
      transformPasted(slice: Slice, view: EditorView) {
        const anchorType = view.state.schema.marks.anchor;
        return anchorType ? new Slice(stripMark(slice.content, anchorType), slice.openStart, slice.openEnd) : slice;
      },
    },
  });
}

/** Rebuilds every decoration; use on load and on visibility changes. */
export function setLabels(view: Pick<EditorView, "state" | "dispatch">, payload: SetLabelsPayload) {
  dispatchAction(view, { type: "set", payload });
}

/** Patches only the blocks it touches; unknown `labels` are added, but recolour or archive through setLabels. */
export function addMediaLabel(
  view: Pick<EditorView, "state" | "dispatch">,
  mediaLabel: IMediaLabel,
  labels: ILabel[] = []
) {
  dispatchAction(view, { type: "upsert", mediaLabel, labels });
}

/** Patches only the blocks involved; same `labels` rule as addMediaLabel. */
export function updateMediaLabel(
  view: Pick<EditorView, "state" | "dispatch">,
  mediaLabel: IMediaLabel,
  labels: ILabel[] = []
) {
  dispatchAction(view, { type: "upsert", mediaLabel, labels });
}

/** Remove one media label, patching only the blocks it touched. */
export function removeMediaLabel(view: Pick<EditorView, "state" | "dispatch">, mediaLabelId: string) {
  dispatchAction(view, { type: "remove", mediaLabelId });
}

/** Hide labels while editing (true) or draw them again (false). applyAnchorMarks() enters edit mode itself. */
export function setLabelsEditMode(view: Pick<EditorView, "state" | "dispatch">, editMode: boolean) {
  dispatchAction(view, { type: "editMode", editMode });
}

/** Empty when labels are hidden or in edit mode; a space inside a passage counts as part of it. */
export function getMediaLabelsAt(state: EditorState, pos: number): string[] {
  const decorations = drawnDecorations(state);
  if (!decorations) return [];
  const touching = decorations.find(pos, pos, isRun);
  // Prefer decorations that contain pos; the one ending exactly at pos is the click just after a word
  const inside = touching.filter((deco) => deco.from <= pos && pos < deco.to);
  return collectIds(inside.length > 0 ? inside : touching);
}

/** mediaLabelIds drawn anywhere in doc range [from, to), for selections and the context menu. */
export function getMediaLabelsInRange(state: EditorState, from: number, to: number): string[] {
  const decorations = drawnDecorations(state);
  if (!decorations || to <= from) return [];
  return collectIds(decorations.find(from, to, isRun).filter((deco) => deco.from < to && deco.to > from));
}

/** A partly selected word counts whole; null when the selection holds no word. */
export function selectionToWordRange(state: EditorState): WordRange | null {
  const { from, to, empty } = state.selection;
  if (empty) return null;
  return wordRangeBetween(getWordIndex(state.doc), from, to);
}

/** Skips needs_review labels (untrusted positions) and stays out of undo history since it is not a user edit. */
export function applyAnchorMarks(state: EditorState, mediaLabels: IMediaLabel[]): Transaction {
  const tr = state.tr;
  const anchorType = state.schema.marks.anchor;
  const index = getWordIndex(state.doc);

  if (anchorType) {
    for (const mediaLabel of mediaLabels) {
      if (mediaLabel.status === AnchorStatus.NEEDS_REVIEW) continue;
      const range = clampRange(mediaLabel, index.count);
      if (!range) continue;
      // Adding marks never moves positions, so the index stays valid for every label
      tr.addMark(
        index.starts[range.start],
        index.ends[range.end],
        anchorType.create({ mediaLabelIds: [mediaLabel.mediaLabelId] })
      );
    }
  }

  return tr.setMeta(labelsPluginKey, { type: "editMode", editMode: true } satisfies LabelsAction).setMeta("addToHistory", false);
}

/** Transaction that removes every anchor mark and leaves edit mode, e.g. on cancel. */
export function removeAnchorMarks(state: EditorState): Transaction {
  const tr = state.tr;
  const anchorType = state.schema.marks.anchor;
  if (anchorType) tr.removeMark(0, state.doc.content.size, anchorType);
  return tr.setMeta(labelsPluginKey, { type: "editMode", editMode: false } satisfies LabelsAction).setMeta("addToHistory", false);
}

/** Labels whose words were all deleted are absent, so the caller can send them to review. */
export function mapAnchorsOnSave(doc: PMNode): MappedAnchor[] {
  const anchorType = doc.type.schema.marks.anchor;
  if (!anchorType) return [];
  const index = getWordIndex(doc);
  const ranges = new Map<string, WordRange>();

  doc.descendants((node, pos) => {
    if (!node.isText) return true;
    for (const mark of node.marks) {
      if (mark.type !== anchorType) continue;
      const ids: string[] = Array.isArray(mark.attrs.mediaLabelIds) ? mark.attrs.mediaLabelIds : [];
      const end = pos + node.nodeSize;
      for (let word = firstWordEndingAfter(index, pos); word < index.count && index.starts[word] < end; word++) {
        for (const id of ids) {
          const range = ranges.get(id);
          if (!range) ranges.set(id, { start: word, end: word });
          else {
            range.start = Math.min(range.start, word);
            range.end = Math.max(range.end, word);
          }
        }
      }
    }
    return true;
  });

  return [...ranges]
    .map(([mediaLabelId, range]) => ({ mediaLabelId, ...range }))
    .sort((a, b) => a.start - b.start || a.end - b.end || a.mediaLabelId.localeCompare(b.mediaLabelId));
}

/** Copy of `content` without anchor marks; used for duplicated paragraphs and pasted text. */
export function stripAnchorMarks(content: Fragment, anchorType: MarkType | undefined): Fragment {
  return anchorType ? stripMark(content, anchorType) : content;
}

function setState(doc: PMNode, editMode: boolean, payload: SetLabelsPayload): LabelsPluginState {
  const index = getWordIndex(doc);
  const mediaLabels = new Map(payload.mediaLabels.map((mediaLabel) => [mediaLabel.mediaLabelId, mediaLabel]));
  const labels = new Map(payload.labels.map((label) => [label.labelId, label]));
  const hiddenLabelIds = new Set(payload.hiddenLabelIds);
  const entries = new Map<string, LabelEntry>();
  for (const mediaLabel of mediaLabels.values()) {
    const entry = resolveEntry(mediaLabel, labels, hiddenLabelIds, index);
    if (entry) entries.set(entry.mediaLabelId, entry);
  }

  const decorations = payload.visible
    ? DecorationSet.create(doc, buildDecorations(index, [...entries.values()]))
    : DecorationSet.empty;

  return { visible: payload.visible, editMode, mediaLabels, labels, hiddenLabelIds, entries, decorations };
}

function upsertMediaLabel(
  state: LabelsPluginState,
  doc: PMNode,
  mediaLabel: IMediaLabel,
  newLabels: ILabel[]
): LabelsPluginState {
  const index = getWordIndex(doc);
  const labels = new Map(state.labels);
  for (const label of newLabels) labels.set(label.labelId, label);
  const mediaLabels = new Map(state.mediaLabels).set(mediaLabel.mediaLabelId, mediaLabel);
  const entries = new Map(state.entries);
  const previous = entries.get(mediaLabel.mediaLabelId);
  const next = resolveEntry(mediaLabel, labels, state.hiddenLabelIds, index);
  if (next) entries.set(next.mediaLabelId, next);
  else entries.delete(mediaLabel.mediaLabelId);

  const touched = [previous, next].filter((entry): entry is LabelEntry => !!entry);
  const decorations = state.visible ? patchDecorations(state.decorations, doc, index, entries, touched) : state.decorations;
  return { ...state, mediaLabels, labels, entries, decorations };
}

function removeEntry(state: LabelsPluginState, doc: PMNode, mediaLabelId: string): LabelsPluginState {
  if (!state.mediaLabels.has(mediaLabelId)) return state;
  const mediaLabels = new Map(state.mediaLabels);
  mediaLabels.delete(mediaLabelId);
  const entries = new Map(state.entries);
  const previous = entries.get(mediaLabelId);
  entries.delete(mediaLabelId);
  if (!previous || !state.visible) return { ...state, mediaLabels, entries };

  const index = getWordIndex(doc);
  const decorations = patchDecorations(state.decorations, doc, index, entries, [previous]);
  return { ...state, mediaLabels, entries, decorations };
}

/** A media label as drawn, or null when it should not be drawn at all. */
function resolveEntry(
  mediaLabel: IMediaLabel,
  labels: ReadonlyMap<string, ILabel>,
  hiddenLabelIds: ReadonlySet<string>,
  index: WordIndex
): LabelEntry | null {
  if (mediaLabel.status === AnchorStatus.NEEDS_REVIEW) return null;
  const range = clampRange(mediaLabel, index.count);
  if (!range) return null;

  const drawn: DrawnLabel[] = [];
  for (const labelId of mediaLabel.labelIds ?? []) {
    const label = labels.get(labelId);
    // Unknown labels are skipped rather than guessed: the label list may still be loading
    if (!label || label.isGroup || label.isActive === false || hiddenLabelIds.has(labelId)) continue;
    if (!label.color || !HEX_COLOR.test(label.color)) continue;
    if (!drawn.some((existing) => existing.labelId === labelId)) drawn.push({ labelId, color: label.color });
  }
  if (drawn.length === 0) return null;
  return { mediaLabelId: mediaLabel.mediaLabelId, start: range.start, end: range.end, labels: drawn };
}

/** Anchor word range clamped to the doc's words, or null when it is malformed or outside them. */
function clampRange(mediaLabel: IMediaLabel, wordCount: number): WordRange | null {
  const start = mediaLabel.anchor?.startWord;
  const end = mediaLabel.anchor?.endWord;
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) return null;
  if (start >= wordCount) return null;
  // A stale anchor past the last word keeps the part that still exists
  return { start, end: Math.min(end, wordCount - 1) };
}

/** Region grows to whole blocks (stripes are per block) and to every overlapping entry (bars depend on all labels on the same words). */
function patchDecorations(
  decorations: DecorationSet,
  doc: PMNode,
  index: WordIndex,
  entries: ReadonlyMap<string, LabelEntry>,
  touched: LabelEntry[]
): DecorationSet {
  if (index.count === 0 || touched.length === 0) return decorations;
  const all = [...entries.values()];

  const regions = touched
    .map((entry) => expandRegion(index, all, entry.start, entry.end))
    .sort((a, b) => a.start - b.start);
  const merged: WordRange[] = [];
  for (const region of regions) {
    const last = merged[merged.length - 1];
    if (last && region.start <= last.end) last.end = Math.max(last.end, region.end);
    else merged.push({ ...region });
  }

  let next = decorations;
  for (const region of merged) {
    const from = index.blocks[index.blockOf[region.start]].pos;
    const to = index.blocks[index.blockOf[region.end]].end;
    // find() also returns neighbours that only touch the edges; keep those
    const stale = next.find(from, to, isOurs).filter((deco) => deco.from >= from && deco.to <= to);
    const inRegion = all.filter((entry) => entry.start <= region.end && entry.end >= region.start);
    next = next.remove(stale).add(doc, buildDecorations(index, inRegion));
  }
  return next;
}

function expandRegion(index: WordIndex, entries: LabelEntry[], start: number, end: number): WordRange {
  let lo = start;
  let hi = end;
  for (;;) {
    let nextLo = index.blocks[index.blockOf[lo]].firstWord;
    let nextHi = index.blocks[index.blockOf[hi]].lastWord;
    for (const entry of entries) {
      if (entry.start <= nextHi && entry.end >= nextLo) {
        nextLo = Math.min(nextLo, entry.start);
        nextHi = Math.max(nextHi, entry.end);
      }
    }
    if (nextLo === lo && nextHi === hi) return { start: lo, end: hi };
    lo = nextLo;
    hi = nextHi;
  }
}

function buildDecorations(index: WordIndex, entries: LabelEntry[]): Decoration[] {
  if (entries.length === 0 || index.count === 0) return [];
  const sorted = [...entries].sort(compareEntries);
  return [...buildRunDecorations(index, sorted), ...buildBlockDecorations(index, sorted)];
}

/** Overlapping or touching entries form one passage, cut where the covering labels change and at block edges. */
function buildRunDecorations(index: WordIndex, sorted: LabelEntry[]): Decoration[] {
  const decorations: Decoration[] = [];
  let i = 0;
  while (i < sorted.length) {
    // Touching entries (end + 1) join the passage so the bar runs on across the space between them
    let clusterEnd = sorted[i].end;
    let j = i + 1;
    while (j < sorted.length && sorted[j].start <= clusterEnd + 1) {
      clusterEnd = Math.max(clusterEnd, sorted[j].end);
      j++;
    }
    const cluster = sorted.slice(i, j);
    i = j;

    const cuts = new Set<number>();
    for (const entry of cluster) {
      cuts.add(entry.start);
      cuts.add(entry.end + 1);
    }
    const points = [...cuts].sort((a, b) => a - b);

    for (let p = 0; p < points.length - 1; p++) {
      const segStart = points[p];
      const segEnd = points[p + 1] - 1;
      const active = cluster.filter((entry) => entry.start <= segStart && entry.end >= segStart);
      if (active.length === 0) continue;
      const labels = orderedLabels(active);
      const mediaLabelIds = active.map((entry) => entry.mediaLabelId);

      let word = segStart;
      while (word <= segEnd) {
        const block = index.blockOf[word];
        const pieceEnd = Math.min(segEnd, index.blocks[block].lastWord);
        const from = index.starts[word];
        // Reach the next covered word in the same block so the bar has no gap at the space
        const to =
          pieceEnd + 1 <= clusterEnd && index.blockOf[pieceEnd + 1] === block
            ? index.starts[pieceEnd + 1]
            : index.ends[pieceEnd];
        decorations.push(...colourBlocks(from, to, labels, mediaLabelIds));
        word = pieceEnd + 1;
      }
    }
  }
  return decorations;
}

/** One inline decoration per label colour, splitting [from, to) evenly in label order. */
function colourBlocks(from: number, to: number, labels: DrawnLabel[], mediaLabelIds: string[]): Decoration[] {
  const spec: DecoSpec = { [SPEC_KEY]: "run", mediaLabelIds };
  const labelIds = labels.map((label) => label.labelId).join(" ");
  const tint = hexToRgba(labels[0].color, LABEL_TINT_ALPHA);
  const make = (start: number, end: number, color: string, bar: string) =>
    Decoration.inline(
      start,
      end,
      {
        class: LABEL_DOM.runClass,
        [LABEL_DOM.mediaLabelIdsAttr]: mediaLabelIds.join(" "),
        [LABEL_DOM.labelIdsAttr]: labelIds,
        style: runStyle(color, tint, bar),
      },
      spec
    );

  const length = to - from;
  // Too few characters for one block each: draw all colours as stops inside one bar
  if (labels.length === 1 || length < labels.length) {
    return [make(from, to, labels[0].color, evenStops(labels.map((label) => label.color)))];
  }
  return labels.map((label, k) => {
    const start = from + Math.round((k * length) / labels.length);
    const end = from + Math.round(((k + 1) * length) / labels.length);
    return make(start, end, label.color, `linear-gradient(${label.color}, ${label.color})`);
  });
}

/** background-image layers leave background-color free for playback and search highlights from other plugins. */
function runStyle(color: string, tint: string, bar: string): string {
  return [
    `--transcript-label-color:${color}`,
    `--transcript-label-tint:${tint}`,
    `background-image:${bar},linear-gradient(${tint},${tint})`,
    "background-size:100% var(--transcript-label-bar, 3px),100% 100%",
    "background-position:0 100%,0 0",
    "background-repeat:no-repeat",
  ].join(";");
}

/** Node decorations exposing label colours per block for the margin stripes. */
function buildBlockDecorations(index: WordIndex, sorted: LabelEntry[]): Decoration[] {
  const byBlock = new Map<number, LabelEntry[]>();
  for (const entry of sorted) {
    for (let block = index.blockOf[entry.start]; block <= index.blockOf[entry.end]; block++) {
      const list = byBlock.get(block);
      if (list) list.push(entry);
      else byBlock.set(block, [entry]);
    }
  }

  const decorations: Decoration[] = [];
  for (const [block, blockEntries] of byBlock) {
    const { pos, end } = index.blocks[block];
    const labels = orderedLabels(blockEntries);
    const shown = labels.slice(0, MAX_LABEL_STRIPES);
    const colors = shown.map((label) => label.color);
    const mediaLabelIds = blockEntries.map((entry) => entry.mediaLabelId);
    const attrs: Record<string, string> = {
      class: LABEL_DOM.blockClass,
      [LABEL_DOM.mediaLabelIdsAttr]: mediaLabelIds.join(" "),
      [LABEL_DOM.labelIdsAttr]: labels.map((label) => label.labelId).join(" "),
      [LABEL_DOM.colorsAttr]: colors.join(" "),
      [LABEL_DOM.countAttr]: String(labels.length),
      style: `--transcript-label-stripes:${evenStops(colors)};--transcript-label-stripe-count:${shown.length}`,
    };
    if (labels.length > MAX_LABEL_STRIPES) attrs[LABEL_DOM.overflowAttr] = String(labels.length - MAX_LABEL_STRIPES);
    const spec: DecoSpec = { [SPEC_KEY]: "block", mediaLabelIds };
    decorations.push(Decoration.node(pos, end, attrs, spec));
  }
  return decorations;
}

/** Labels of `entries` in entry order, each label once. */
function orderedLabels(entries: LabelEntry[]): DrawnLabel[] {
  const seen = new Set<string>();
  const labels: DrawnLabel[] = [];
  for (const entry of entries) {
    for (const label of entry.labels) {
      if (seen.has(label.labelId)) continue;
      seen.add(label.labelId);
      labels.push(label);
    }
  }
  return labels;
}

// Stable order: position first, then id, so colour blocks never reshuffle between renders
function compareEntries(a: LabelEntry, b: LabelEntry): number {
  return a.start - b.start || a.end - b.end || (a.mediaLabelId < b.mediaLabelId ? -1 : a.mediaLabelId > b.mediaLabelId ? 1 : 0);
}

/** linear-gradient with hard, equal-width stops, one per colour. */
function evenStops(colors: string[]): string {
  if (colors.length === 1) return `linear-gradient(${colors[0]}, ${colors[0]})`;
  const stops = colors.map((color, k) => {
    const start = ((k * 100) / colors.length).toFixed(2);
    const end = (((k + 1) * 100) / colors.length).toFixed(2);
    return `${color} ${start}% ${end}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

function hexToRgba(hex: string, alpha: number): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function stripMark(content: Fragment, markType: MarkType): Fragment {
  const children: PMNode[] = [];
  content.forEach((child) => {
    if (child.isText) children.push(markType.isInSet(child.marks) ? child.mark(markType.removeFromSet(child.marks)) : child);
    else children.push(child.copy(stripMark(child.content, markType)));
  });
  // fromArray joins neighbouring text nodes whose marks became equal
  return Fragment.fromArray(children);
}

function drawnDecorations(state: EditorState): DecorationSet | null {
  const pluginState = labelsPluginKey.getState(state);
  if (!pluginState || !pluginState.visible || pluginState.editMode) return null;
  return pluginState.decorations;
}

function collectIds(decorations: Decoration[]): string[] {
  const ids = new Set<string>();
  for (const deco of decorations) for (const id of (deco.spec as DecoSpec).mediaLabelIds) ids.add(id);
  return [...ids];
}

function isRun(spec: Partial<DecoSpec>): boolean {
  return spec?.[SPEC_KEY] === "run";
}

function isOurs(spec: Partial<DecoSpec>): boolean {
  return spec?.[SPEC_KEY] === "run" || spec?.[SPEC_KEY] === "block";
}

function dispatchAction(view: Pick<EditorView, "state" | "dispatch">, action: LabelsAction) {
  view.dispatch(view.state.tr.setMeta(labelsPluginKey, action).setMeta("addToHistory", false));
}
