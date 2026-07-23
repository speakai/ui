/**
 * Transcript search has to span word nodes.
 *
 * Every transcript word is its own text node (each carries a `word` mark with
 * ASR timings), so a phrase like "recording to see" is split across several
 * nodes. Matching node-by-node could only ever hit inside a single word, so
 * any multi-word query reported "No matches found".
 */
import { describe, it, expect } from "vitest";
import { makeEditorState } from "./helpers";
import { findMatchesForTest } from "../../src/transcript/plugins/find-replace";

const TEXT = "I'm just doing this test recording to see if it";

/** One segment whose words each become a separately marked text node. */
function docWithWords(text = TEXT) {
  const words = text.split(" ");
  let t = 0;
  const entities = words.map((w) => {
    const e = { text: w, startInSec: t, endInSec: t + 1 };
    t += 1;
    return e;
  });
  return makeEditorState([{ text, speakerId: "0", entities }]).doc;
}

describe("findMatches", () => {
  it("matches a phrase spanning several word nodes", () => {
    const doc = docWithWords();
    const matches = findMatchesForTest(doc, "recording to see", false);
    expect(matches).toHaveLength(1);
    expect(doc.textBetween(matches[0].from, matches[0].to)).toBe("recording to see");
  });

  it("still matches a single word", () => {
    const doc = docWithWords();
    const matches = findMatchesForTest(doc, "recording", false);
    expect(matches).toHaveLength(1);
    expect(doc.textBetween(matches[0].from, matches[0].to)).toBe("recording");
  });

  it("is case-insensitive by default and exact when caseSensitive", () => {
    const doc = docWithWords();
    expect(findMatchesForTest(doc, "RECORDING TO SEE", false)).toHaveLength(1);
    expect(findMatchesForTest(doc, "RECORDING TO SEE", true)).toHaveLength(0);
  });

  it("supports regex across word nodes", () => {
    const doc = docWithWords();
    const matches = findMatchesForTest(doc, "recording\\s+to", false, true);
    expect(matches).toHaveLength(1);
    expect(doc.textBetween(matches[0].from, matches[0].to)).toBe("recording to");
  });

  it("returns nothing for a phrase that is not present", () => {
    expect(findMatchesForTest(docWithWords(), "recording to hear", false)).toHaveLength(0);
  });

  it("finds every occurrence of a repeated phrase", () => {
    const doc = docWithWords("go now and go now please");
    expect(findMatchesForTest(doc, "go now", false)).toHaveLength(2);
  });

  it("does not match across separate segments", () => {
    const state = makeEditorState([
      { text: "hook or not.", speakerId: "0" },
      { text: "I will start", speakerId: "0" },
    ]);
    expect(findMatchesForTest(state.doc, "not. I will", false)).toHaveLength(0);
  });
});
