import { describe, it, expect } from "vitest";
import { EditorState, TextSelection, type Transaction } from "prosemirror-state";
import type { Decoration } from "prosemirror-view";
import {
  clipSelectionPluginKey,
  createClipSelectionPlugin,
  getClipTimesFromSelection,
  setClipMode,
} from "../../src/transcript/plugins/clip-selection";
import { makeEditorState } from "./helpers";

const words = (text: string, start: number) =>
  text.split(" ").map((w, i) => ({ text: w, startInSec: start + i, endInSec: start + i + 1 }));

// Two paragraphs, one word per second: alpha..delta = [0,4], echo..hotel = [10,14].
function makeView(withWords = true) {
  const base = makeEditorState([
    { text: "alpha bravo charlie delta", startInSec: 0, endInSec: 4, entities: withWords ? words("alpha bravo charlie delta", 0) : undefined },
    { text: "echo foxtrot golf hotel", startInSec: 10, endInSec: 14, entities: withWords ? words("echo foxtrot golf hotel", 10) : undefined },
  ]);
  const view = {
    state: EditorState.create({ doc: base.doc, plugins: [createClipSelectionPlugin()] }),
    dispatch(tr: Transaction) {
      view.state = view.state.apply(tr);
    },
  };
  return view;
}

type View = ReturnType<typeof makeView>;

function badges(view: View): { label: string; before: string }[] {
  const decorations: Decoration[] = clipSelectionPluginKey.getState(view.state)!.decorations.find();
  return decorations
    .filter((d) => d.from === d.to)
    .map((d) => {
      const dom = (d as unknown as { type: { toDOM: HTMLElement } }).type.toDOM;
      const after = view.state.doc.textBetween(d.from, view.state.doc.content.size, " ");
      return { label: dom.textContent!, before: after.trim().split(/\s+/)[0] };
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

describe("getClipTimesFromSelection", () => {
  it("uses the selected words' times and badges the first highlighted word", () => {
    const view = makeView();
    selectText(view, "bravo charlie");
    expect(getClipTimesFromSelection(view)).toEqual({ start: 1, end: 3, text: "bravo charlie" });

    setClipMode(view, true, [
      { start: 11, end: 12, order: 1 },
      { start: 0, end: 1, order: 0 },
    ]);
    expect(badges(view)).toEqual([
      { label: "1", before: "alpha" },
      { label: "2", before: "foxtrot" },
    ]);
  });

  it("falls back to the block's times when the text has no word timings", () => {
    const view = makeView(false);
    selectText(view, "bravo charlie");
    expect(getClipTimesFromSelection(view)).toEqual({ start: 0, end: 4, text: "bravo charlie" });
  });
});
