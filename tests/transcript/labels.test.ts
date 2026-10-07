import { describe, it, expect, vi } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { Decoration } from "prosemirror-view";
import { AnchorStatus, LabelSource, flattenWords } from "@speakai/shared";
import type { ILabel, IMediaLabel, ITranscriptSegment } from "@speakai/shared";
import {
  LABEL_DOM,
  addMediaLabel,
  applyAnchorMarks,
  createLabelsPlugin,
  getMediaLabelsAt,
  labelsPluginKey,
  mapAnchorsOnSave,
  removeMediaLabel,
  selectionToWordRange,
  setLabels,
} from "../../src/transcript/plugins/labels";
import { createEditCommandsPlugin, duplicateParagraphCommand } from "../../src/transcript/plugins/edit-commands";
import { extractSegmentsFromDoc } from "../../src/transcript/utils/entities";
import { getWordIndex } from "../../src/transcript/utils/word-index";
import { makeEditorState, setCursor } from "./helpers";
import type { SegmentFixture } from "./helpers";

const RED = "#dc2626";
const BLUE = "#2563eb";

function label(labelId: string, color: string, extra: Partial<ILabel> = {}): ILabel {
  return {
    _id: labelId, labelId, companyId: "c1", userId: "u1", isGroup: false, name: labelId,
    color, source: LabelSource.USER, isActive: true, createdAt: new Date(0), updatedAt: new Date(0),
    ...extra,
  };
}

function mediaLabel(mediaLabelId: string, labelIds: string[], startWord: number, endWord: number,
  status = AnchorStatus.ACTIVE): IMediaLabel {
  return {
    _id: mediaLabelId, mediaLabelId, companyId: "c1", userId: "u1", mediaId: "m1", labelIds, status,
    anchor: { startWord, endWord, exact: "", prefix: "", suffix: "", startInSec: 0, endInSec: 0, speakerIds: [], transcriptRevision: 0 },
    createdAt: new Date(0), updatedAt: new Date(0),
  };
}

/** One plain (untimed) segment per entry; each becomes its own paragraph and block. */
function plainState(texts: string[]): EditorState {
  const base = makeEditorState(texts.map((text, i) => ({ text, startInSec: i * 10, endInSec: i * 10 + 9 })));
  return EditorState.create({ doc: base.doc, plugins: [createEditCommandsPlugin(), createLabelsPlugin()] });
}

/** Minimal view: enough for the dispatching helpers. */
function fakeView(state: EditorState) {
  const view = {
    state,
    dispatch(tr: Transaction) {
      view.state = view.state.apply(tr);
    },
  };
  return view;
}

function decorations(state: EditorState): Decoration[] {
  return labelsPluginKey.getState(state)!.decorations.find();
}

function runs(state: EditorState): Decoration[] {
  return decorations(state)
    .filter((deco) => (deco as any).type.attrs?.class === LABEL_DOM.runClass)
    .sort((a, b) => a.from - b.from);
}

function attrs(deco: Decoration): Record<string, string> {
  return (deco as any).type.attrs;
}

function wordText(state: EditorState, word: number): string {
  const index = getWordIndex(state.doc);
  return state.doc.textBetween(index.starts[word], index.ends[word]);
}

describe("word index", () => {
  it("counts words exactly like flattenWords, before and after the save round trip", () => {
    const fixtures: SegmentFixture[] = [
      {
        text: "Hello, world! It's fine.", startInSec: 0, endInSec: 3,
        entities: [
          { text: "Hello,", startInSec: 0, endInSec: 0.5 },
          { text: "world!", startInSec: 0.5, endInSec: 1 },
          { text: "It's", startInSec: 1, endInSec: 2 },
          { text: "fine.", startInSec: 2, endInSec: 3 },
        ],
      },
      {
        // Multi-word entity, punctuation-only entity, unmarked text between entities
        text: "We moved to New York — really.", startInSec: 3, endInSec: 6,
        entities: [
          { text: "We", startInSec: 3, endInSec: 3.5 },
          { text: "moved", startInSec: 3.5, endInSec: 4 },
          { text: "New York", startInSec: 4.5, endInSec: 5 },
          { text: "—", startInSec: 5, endInSec: 5.2 },
          { text: "really.", startInSec: 5.2, endInSec: 6 },
        ],
      },
      { text: "no entities here , ok ... don’t", startInSec: 6, endInSec: 9 },
      { text: " ... ", startInSec: 9, endInSec: 10 },
      { text: "Don’t stop", startInSec: 10, endInSec: 11, entities: [
        { text: "Don’t", startInSec: 10, endInSec: 10.5 },
        { text: "stop", startInSec: 10.5, endInSec: 11 },
      ] },
    ];
    const state = makeEditorState(fixtures);
    const segments: ITranscriptSegment[] = fixtures.map((fixture, i) => ({
      id: i + 1,
      speakerId: "1",
      text: fixture.text,
      confidence: 1,
      instances: [{ start: fixture.startInSec!, end: fixture.endInSec!, startInSec: fixture.startInSec, endInSec: fixture.endInSec }],
      entities: fixture.entities?.map((entity) => ({ text: entity.text, instances: { startInSec: entity.startInSec, endInSec: entity.endInSec } })),
    }));

    const index = getWordIndex(state.doc);
    const docWords = Array.from({ length: index.count }, (_, word) => wordText(state, word));
    // "to" is plain text between entities, so it is not saved as a word
    const expected = flattenWords(segments).map((word) => word.text);
    expect(docWords).toEqual(expected);
    expect(flattenWords(extractSegmentsFromDoc(state.doc)).map((word) => word.text)).toEqual(expected);
  });
});

describe("selectionToWordRange", () => {
  it("snaps partial words to whole words and ignores selections without words", () => {
    const state = plainState(["alpha beta gamma", "delta epsilon"]);
    const index = getWordIndex(state.doc);
    const select = (from: number, to: number) =>
      state.apply(state.tr.setSelection(TextSelection.create(state.doc, from, to)));

    // From inside "alpha" to inside "gamma"
    expect(selectionToWordRange(select(index.starts[0] + 2, index.starts[2] + 1))).toEqual({ start: 0, end: 2 });
    // Across blocks: inside "gamma" to inside "delta"
    expect(selectionToWordRange(select(index.starts[2] + 1, index.starts[3] + 2))).toEqual({ start: 2, end: 3 });
    // Only the space between "alpha" and "beta"
    expect(selectionToWordRange(select(index.ends[0], index.starts[1]))).toBeNull();
    expect(selectionToWordRange(state)).toBeNull();
  });
});

describe("label decorations", () => {
  it("splits overlapping labels into proportional colour blocks with continuous coverage and block stripes", () => {
    const view = fakeView(plainState(["one two three four five six"]));
    setLabels(view, {
      labels: [label("red", RED), label("blue", BLUE)],
      mediaLabels: [mediaLabel("mlA", ["red"], 0, 3), mediaLabel("mlB", ["blue"], 2, 5)],
      hiddenLabelIds: [],
      visible: true,
    });
    const index = getWordIndex(view.state.doc);
    const pieces = runs(view.state);

    // red only (one two), red|blue (three four), blue only (five six)
    expect(pieces.map((deco) => attrs(deco)[LABEL_DOM.labelIdsAttr])).toEqual(["red", "red blue", "red blue", "blue"]);
    // One unbroken bar from the first to the last labelled character
    expect(pieces[0].from).toBe(index.starts[0]);
    expect(pieces[pieces.length - 1].to).toBe(index.ends[5]);
    for (let i = 1; i < pieces.length; i++) expect(pieces[i].from).toBe(pieces[i - 1].to);
    // The shared passage is split evenly: red block then blue block
    const [, redHalf, blueHalf] = pieces;
    expect(Math.abs((redHalf.to - redHalf.from) - (blueHalf.to - blueHalf.from))).toBeLessThanOrEqual(1);
    expect(attrs(redHalf).style).toContain(`linear-gradient(${RED}, ${RED})`);
    expect(attrs(blueHalf).style).toContain(`linear-gradient(${BLUE}, ${BLUE})`);
    // Tint comes from the first label on the passage
    expect(attrs(redHalf).style).toContain("rgba(220, 38, 38, 0.16)");

    const block = decorations(view.state).find((deco) => attrs(deco).class === LABEL_DOM.blockClass)!;
    expect(attrs(block)[LABEL_DOM.colorsAttr]).toBe(`${RED} ${BLUE}`);
    expect(attrs(block)[LABEL_DOM.countAttr]).toBe("2");
    expect(attrs(block)[LABEL_DOM.overflowAttr]).toBeUndefined();

    expect(getMediaLabelsAt(view.state, index.starts[0] + 1)).toEqual(["mlA"]);
    expect(getMediaLabelsAt(view.state, index.starts[3] + 1).sort()).toEqual(["mlA", "mlB"]);
  });

  it("reports stripe overflow past four labels", () => {
    const view = fakeView(plainState(["one two three"]));
    const ids = ["a", "b", "c", "d", "e", "f"];
    setLabels(view, {
      labels: ids.map((id) => label(id, RED)),
      mediaLabels: [mediaLabel("ml", ids, 0, 2)],
      hiddenLabelIds: [],
      visible: true,
    });
    const block = decorations(view.state).find((deco) => attrs(deco).class === LABEL_DOM.blockClass)!;
    expect(attrs(block)[LABEL_DOM.colorsAttr].split(" ")).toHaveLength(4);
    expect(attrs(block)[LABEL_DOM.overflowAttr]).toBe("2");
  });

  it("skips needs_review, archived, group, hidden and colourless labels, and everything when not visible", () => {
    const view = fakeView(plainState(["one two three four five"]));
    const payload = {
      labels: [label("archived", RED, { isActive: false }), label("hidden", RED), label("group", RED, { isGroup: true }),
        label("nocolour", ""), label("shown", BLUE)],
      mediaLabels: [
        mediaLabel("review", ["shown"], 0, 0, AnchorStatus.NEEDS_REVIEW),
        mediaLabel("mlArchived", ["archived"], 1, 1),
        mediaLabel("mlHidden", ["hidden"], 2, 2),
        mediaLabel("mlGroup", ["group", "nocolour"], 3, 3),
        mediaLabel("mlShown", ["shown", "hidden"], 4, 4),
      ],
      hiddenLabelIds: ["hidden"],
      visible: true,
    };
    setLabels(view, payload);
    const index = getWordIndex(view.state.doc);
    expect(runs(view.state).map((deco) => attrs(deco)[LABEL_DOM.mediaLabelIdsAttr])).toEqual(["mlShown"]);
    expect(attrs(runs(view.state)[0])[LABEL_DOM.labelIdsAttr]).toBe("shown");
    expect(getMediaLabelsAt(view.state, index.starts[0])).toEqual([]);

    setLabels(view, { ...payload, visible: false });
    expect(decorations(view.state)).toHaveLength(0);
    expect(getMediaLabelsAt(view.state, index.starts[4] + 1)).toEqual([]);
  });

  it("adds and removes one label without rebuilding the others", () => {
    const view = fakeView(plainState(["first block words", "second block words", "third block words"]));
    setLabels(view, {
      labels: [label("red", RED)],
      mediaLabels: [mediaLabel("far", ["red"], 0, 1)],
      hiddenLabelIds: [],
      visible: true,
    });
    const inlineSpy = vi.spyOn(Decoration, "inline");
    const nodeSpy = vi.spyOn(Decoration, "node");
    const created = () => inlineSpy.mock.calls.length + nodeSpy.mock.calls.length;

    // "green" was just created in the picker, so it comes with the media label
    addMediaLabel(view, mediaLabel("new", ["green"], 6, 7), [label("green", "#16a34a")]);
    // Only the new label's bar and block stripe are built; "far" in the first block is left alone
    expect(created()).toBe(2);
    expect(runs(view.state).map((deco) => attrs(deco)[LABEL_DOM.mediaLabelIdsAttr])).toEqual(["far", "new"]);

    removeMediaLabel(view, "new");
    expect(created()).toBe(2);
    expect(runs(view.state).map((deco) => attrs(deco)[LABEL_DOM.mediaLabelIdsAttr])).toEqual(["far"]);
    expect(decorations(view.state)).toHaveLength(2);

    inlineSpy.mockRestore();
    nodeSpy.mockRestore();
  });
});

describe("edit-mode anchors", () => {
  it("maps anchors to new word positions after inserts before and inside a label", () => {
    let state = plainState(["alpha beta gamma", "one two three four"]);
    state = state.apply(applyAnchorMarks(state, [mediaLabel("early", ["red"], 1, 2), mediaLabel("late", ["red"], 4, 5)]));
    expect(labelsPluginKey.getState(state)!.editMode).toBe(true);
    expect(mapAnchorsOnSave(state.doc)).toEqual([
      { mediaLabelId: "early", start: 1, end: 2 },
      { mediaLabelId: "late", start: 4, end: 5 },
    ]);

    // A new word before both labels shifts them by one
    const index = getWordIndex(state.doc);
    state = state.apply(state.tr.insertText("new ", index.starts[0]));
    // A new word inside "late" (between "two" and "three") grows it by one
    const shifted = getWordIndex(state.doc);
    state = state.apply(state.tr.insertText(" extra", shifted.ends[5]));

    expect(mapAnchorsOnSave(state.doc)).toEqual([
      { mediaLabelId: "early", start: 2, end: 3 },
      { mediaLabelId: "late", start: 5, end: 7 },
    ]);
    // The positions match what the saved transcript will count
    expect(flattenWords(extractSegmentsFromDoc(state.doc)).slice(5, 8).map((word) => word.text)).toEqual(["two", "extra", "three"]);
  });

  it("does not copy anchors when a paragraph is duplicated", () => {
    let state = plainState(["alpha beta", "gamma delta"]);
    state = state.apply(applyAnchorMarks(state, [mediaLabel("ml", ["red"], 0, 1)]));
    state = setCursor(state, 0, 1);

    let next: EditorState | null = null;
    duplicateParagraphCommand(state, (tr) => { next = state.apply(tr); });

    const duplicated = next as unknown as EditorState;
    expect(duplicated.doc.childCount).toBe(3);
    expect(wordText(duplicated, 2)).toBe("alpha");
    expect(mapAnchorsOnSave(duplicated.doc)).toEqual([{ mediaLabelId: "ml", start: 0, end: 1 }]);
  });
});
