/**
 * Enter split inside a paragraph_container holding several transcript_blocks.
 *
 * buildDocFromSegments groups consecutive same-speaker segments into one
 * container with one block per segment, so this is the ordinary shape for any
 * transcript with more than one segment per speaker turn. The fixtures in
 * helpers.ts give each container a single block, which cannot express it.
 */
import { describe, it, expect } from "vitest";
import { EditorState, TextSelection } from "prosemirror-state";
import { transcriptSchema as schema } from "../../src/transcript/schema";
import { handleEnterKey } from "../../src/transcript/plugins/edit-commands";

/** One sentence per word, each carrying a word mark, spanning [start,end]. */
function buildBlock(id: number, text: string, start: number, end: number) {
  const parts = text.split(" ");
  const step = (end - start) / parts.length;
  const nodes = parts.map((w, i) => {
    const wStart = start + i * step;
    const wEnd = start + (i + 1) * step;
    const mark = schema.marks.word.create({ startInSec: wStart, endInSec: wEnd, speakerId: "0" });
    return schema.text(i === 0 ? w : ` ${w}`, [mark]);
  });
  const sentence = schema.node(
    "sentence",
    { sentenceId: String(id), speakerId: "0", startInSec: start, endInSec: end },
    nodes
  );
  return schema.node(
    "transcript_block",
    {
      paragraphId: 1,
      sentenceId: String(id),
      speakerId: "0",
      speaker: { name: "Speaker 0", userId: "0", speakerImg: "" },
      startInSec: start,
      endInSec: end,
      isParagraphStart: id === 1,
    },
    [sentence]
  );
}

/** One container, three blocks — the shape buildDocFromSegments produces. */
function makeMultiBlockState(): EditorState {
  const container = schema.node(
    "paragraph_container",
    {
      speakerId: "0",
      speaker: { name: "Speaker 0", userId: "0", speakerImg: "" },
      paragraphId: 1,
      start: 0,
      end: 30,
    },
    [buildBlock(1, "alpha bravo charlie delta", 0, 10), buildBlock(2, "echo foxtrot", 10, 20), buildBlock(3, "golf hotel", 20, 30)]
  );
  return EditorState.create({ doc: schema.node("doc", null, [container]) });
}

function shape(state: EditorState) {
  const containers: { text: string; start: number; end: number; blocks: number }[] = [];
  state.doc.forEach((node) => {
    if (node.type.name !== "paragraph_container") return;
    containers.push({
      text: node.textContent,
      start: Number(node.attrs.start),
      end: Number(node.attrs.end),
      blocks: node.childCount,
    });
  });
  return containers;
}

/** Caret `offset` characters into the first sentence. */
function withCursor(state: EditorState, offset: number): EditorState {
  let sentencePos: number | null = null;
  state.doc.descendants((node, pos) => {
    if (sentencePos === null && node.type.name === "sentence") sentencePos = pos;
    return sentencePos === null;
  });
  return state.apply(
    state.tr.setSelection(TextSelection.near(state.doc.resolve(sentencePos! + 1 + offset)))
  );
}

describe("handleEnterKey — multi-block paragraph_container", () => {
  it("moves the trailing blocks into the new paragraph so reading order is preserved", () => {
    const state = withCursor(makeMultiBlockState(), 11); // after "alpha bravo"
    let tr: import("prosemirror-state").Transaction | null = null;
    expect(handleEnterKey(state, (t) => { tr = t; })).toBe(true);

    const containers = shape(state.apply(tr!));
    expect(containers).toHaveLength(2);
    expect(containers[0].text).toBe("alpha bravo");
    // The split-off half must lead the new paragraph, ahead of the moved blocks.
    expect(containers[1].text.startsWith(" charlie delta")).toBe(true);
    expect(containers[1].text).toContain("echo foxtrot");
    expect(containers[1].text).toContain("golf hotel");
    expect(containers[1].blocks).toBe(3);
  });

  it("keeps word-mark timings absolute instead of re-timing them onto the split window", () => {
    const state = withCursor(makeMultiBlockState(), 11);
    let tr: import("prosemirror-state").Transaction | null = null;
    handleEnterKey(state, (t) => { tr = t; });

    const marks: { text: string; start: number }[] = [];
    state.apply(tr!).doc.descendants((node) => {
      if (!node.isText) return true;
      const word = node.marks.find((m) => m.type.name === "word");
      if (word) marks.push({ text: node.text!.trim(), start: Number(word.attrs.startInSec) });
      return true;
    });

    // "alpha" is word 1 of 4 across [0,10] — unchanged by the split.
    expect(marks.find((m) => m.text === "alpha")!.start).toBe(0);
    expect(marks.find((m) => m.text === "charlie")!.start).toBeCloseTo(5, 5);
    expect(marks.find((m) => m.text === "echo")!.start).toBe(10);
  });

  it("gives each half a timing range drawn from its own words", () => {
    const state = withCursor(makeMultiBlockState(), 11);
    let tr: import("prosemirror-state").Transaction | null = null;
    handleEnterKey(state, (t) => { tr = t; });

    const containers = shape(state.apply(tr!));
    expect(containers[0].start).toBe(0);
    expect(containers[0].end).toBeCloseTo(5, 5);
    expect(containers[1].start).toBeCloseTo(5, 5);
    expect(containers[1].end).toBe(30);
  });
});
