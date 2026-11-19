import { describe, it, expect } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import type { Decoration } from "prosemirror-view";
import {
  clipSelectionPluginKey,
  createClipSelectionPlugin,
  getClipTimesFromSelection,
  setClipMode,
  updateClipDecorations,
  type ClipSegmentInput,
} from "../../src/transcript/plugins/clip-selection";
import { makeEditorState } from "./helpers";

const words = (text: string, start: number) =>
  text.split(" ").map((w, i) => ({ text: w, startInSec: start + i, endInSec: start + i + 1 }));

// Two paragraphs, one word per second: alpha..delta = [0,4], echo..hotel = [10,14].
function makeView() {
  const base = makeEditorState([
    { text: "alpha bravo charlie delta", startInSec: 0, endInSec: 4, entities: words("alpha bravo charlie delta", 0) },
    { text: "echo foxtrot golf hotel", startInSec: 10, endInSec: 14, entities: words("echo foxtrot golf hotel", 10) },
  ]);
  const view = {
    state: EditorState.create({ doc: base.doc, plugins: [createClipSelectionPlugin()] }),
    dispatch(tr: import("prosemirror-state").Transaction) {
      view.state = view.state.apply(tr);
    },
  };
  return view;
}

type View = ReturnType<typeof makeView>;

function decorations(view: View): Decoration[] {
  return clipSelectionPluginKey.getState(view.state)!.decorations.find();
}

/** Highlighted words, in document order. */
function highlightedWords(view: View): string[] {
  return decorations(view)
    .filter((d) => d.from !== d.to && view.state.doc.resolve(d.from).parent.isTextblock)
    .map((d) => view.state.doc.textBetween(d.from, d.to).trim());
}

function badges(view: View): { label: string; before: string }[] {
  return decorations(view)
    .filter((d) => d.from === d.to)
    .map((d) => {
      const dom = (d as unknown as { type: { toDOM: HTMLElement } }).type.toDOM;
      return { label: dom.textContent!, before: view.state.doc.textBetween(d.from, d.from + 6).trim() };
    });
}

function selectText(view: View, text: string) {
  let from = -1;
  view.state.doc.descendants((node, pos) => {
    if (from === -1 && node.isTextblock) {
      const idx = node.textContent.indexOf(text);
      if (idx !== -1) from = pos + 1 + idx;
    }
    return from === -1;
  });
  view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, from, from + text.length)));
}

describe("clip selection decorations", () => {
  it("highlights nothing until clip mode is on", () => {
    const view = makeView();
    updateClipDecorations(view, [{ start: 1, end: 3, order: 0 }]);
    expect(decorations(view)).toHaveLength(0);
  });

  it("highlights exactly the words inside the segment, not their neighbours", () => {
    const view = makeView();
    setClipMode(view, true, [{ start: 1, end: 3, order: 0 }]);
    expect(highlightedWords(view)).toEqual(["bravo", "charlie"]);
  });

  it("treats segment edges as exclusive so a word ending at the start is not included", () => {
    const view = makeView();
    setClipMode(view, true, [{ start: 2, end: 2.5, order: 0 }]);
    expect(highlightedWords(view)).toEqual(["charlie"]);
  });

  it("numbers each segment's badge from its order, at its first highlighted word", () => {
    const view = makeView();
    const segments: ClipSegmentInput[] = [
      { start: 11, end: 12, order: 1 },
      { start: 0, end: 1, order: 0 },
    ];
    setClipMode(view, true, segments);
    expect(highlightedWords(view)).toEqual(["alpha", "foxtrot"]);
    expect(badges(view).map((b) => b.label).sort()).toEqual(["1", "2"]);
  });

  it("adds no badge for a segment that matches no words", () => {
    const view = makeView();
    setClipMode(view, true, [{ start: 100, end: 120, order: 0 }]);
    expect(badges(view)).toHaveLength(0);
  });

  it("clears every highlight when clip mode is turned off", () => {
    const view = makeView();
    setClipMode(view, true, [{ start: 0, end: 14, order: 0 }]);
    setClipMode(view, false, []);
    expect(decorations(view)).toHaveLength(0);
  });

  it("updates highlights when segments change but keeps clip mode", () => {
    const view = makeView();
    setClipMode(view, true, [{ start: 0, end: 1, order: 0 }]);
    updateClipDecorations(view, [{ start: 12, end: 14, order: 0 }]);
    expect(highlightedWords(view)).toEqual(["golf", "hotel"]);
  });

  it("keeps highlights on the same words after text is typed before them", () => {
    const view = makeView();
    setClipMode(view, true, [{ start: 12, end: 13, order: 0 }]);
    view.dispatch(view.state.tr.insertText("so ", 3));
    expect(highlightedWords(view)).toEqual(["golf"]);
  });
});

describe("getClipTimesFromSelection", () => {
  it("returns null for an empty selection", () => {
    const view = makeView();
    view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, 4)));
    expect(getClipTimesFromSelection(view)).toBeNull();
  });

  it("returns the selected words' text", () => {
    const view = makeView();
    selectText(view, "bravo charlie");
    expect(getClipTimesFromSelection(view)!.text).toBe("bravo charlie");
  });
});
