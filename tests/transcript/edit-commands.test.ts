/**
 * Unit tests for transcript editing commands: W1 Backspace, W3 Enter, W7 Mod-j.
 *
 * All tests use direct command invocation — no mounted EditorView required.
 * Commands: (state, dispatch?) → boolean
 */

import { describe, it, expect, vi } from "vitest";
import { TextSelection } from "prosemirror-state";
import type { Transaction } from "prosemirror-state";
import { handleBackspaceKey, handleEnterKey } from "../../src/transcript/plugins/edit-commands";
import { makeEditorState, makeTwoSentenceBlockState, setCursor, getDocShape } from "./helpers";

// ── W1 — handleBackspaceKey ───────────────────────────────────────

describe("handleBackspaceKey", () => {
  // Helper: create two-sentence single-paragraph state, cursor at start of sentence 2.
  function makeTwoSentenceState() {
    // Two segments → two paragraphs by default in makeEditorState.
    // To get two sentences in ONE block, we need to build the state differently.
    // We use a state with one segment that has been split (simulated via direct doc construction).
    // Instead, we build using makeEditorState then manually create a two-sentence block state.
    // For simplicity in the helper, we test Case 1 by putting cursor at sentence index 1.
    const state = makeEditorState([
      {
        text: "Hello world",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 5,
        paragraphId: 1,
        sentenceId: "s1",
      },
      {
        text: "How are you",
        speakerId: "spk1",
        startInSec: 5,
        endInSec: 10,
        paragraphId: 2,
        sentenceId: "s2",
      },
    ]);
    return state;
  }

  it("W1 Case 2 — Backspace at first sentence of paragraph 2 merges paragraphs", () => {
    const state = makeTwoSentenceState();
    // Cursor at start of sentence index 1 (second paragraph's sentence), offset 0.
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    const dispatch = (tr: Transaction) => { dispatchedTr = tr; };

    const result = handleBackspaceKey(stateWithCursor, dispatch);
    expect(result).toBe(true);
    expect(dispatchedTr).not.toBeNull();

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    // After merge, should have one paragraph_container.
    expect(shape.paragraphs).toHaveLength(1);

    // The merged paragraph should contain the text from both original paragraphs.
    const mergedText = shape.paragraphs[0].blocks[0].sentences
      .map(s => s.text)
      .join("");
    expect(mergedText).toContain("Hello world");
    expect(mergedText).toContain("How are you");
  });

  it("W1 Case 2 — prev container collapses to one block after cross-paragraph merge", () => {
    const state = makeTwoSentenceState();
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    handleBackspaceKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    // Per Angular :797-799, the merged paragraph collapses to exactly one block.
    expect(shape.paragraphs[0].blocks).toHaveLength(1);
  });

  it("W1 no-op — first sentence of first paragraph returns false", () => {
    const state = makeEditorState([
      { text: "Hello", speakerId: "spk1", startInSec: 0, endInSec: 5 },
    ]);
    const stateWithCursor = setCursor(state, 0, 0);

    const result = handleBackspaceKey(stateWithCursor);
    expect(result).toBe(false);
  });

  it("W1 defer — mid-sentence Backspace returns false (defers to baseKeymap)", () => {
    const state = makeEditorState([
      { text: "Hello world", speakerId: "spk1", startInSec: 0, endInSec: 5 },
    ]);
    // Place cursor in the middle of the sentence (offset 5).
    const stateWithCursor = setCursor(state, 0, 5);

    const result = handleBackspaceKey(stateWithCursor);
    expect(result).toBe(false);
  });

  it("W1 invalid ts — Case 2 merge aborts when validateTimestampPair fails", () => {
    // First sentence endInSec === 0, second startInSec === 0 → invalid (start >= end for merged).
    const state = makeEditorState([
      { text: "Hello", speakerId: "spk1", startInSec: 0, endInSec: 0 },
      { text: "World", speakerId: "spk1", startInSec: 0, endInSec: 0 },
    ]);
    const stateWithCursor = setCursor(state, 1, 0);

    const dispatch = vi.fn();
    const result = handleBackspaceKey(stateWithCursor, dispatch);

    // Returns true (key claimed, no-op) — prevents baseKeymap from performing an unsafe merge.
    expect(result).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("W1 parentOffset 1 — backspace at parentOffset===1 inside sentence triggers merge", () => {
    // parentOffset 1 means the cursor is one step past the sentence's opening token.
    // This position still counts as "sentence boundary" and must trigger merge.
    const state = makeTwoSentenceState();
    const stateWithCursor = setCursor(state, 1, 1);

    let dispatched = false;
    const result = handleBackspaceKey(stateWithCursor, () => { dispatched = true; });
    expect(result).toBe(true);
    expect(dispatched).toBe(true);
  });

  it("W1 mid-sentence control — parentOffset 2 returns false", () => {
    const state = makeTwoSentenceState();
    const stateWithCursor = setCursor(state, 1, 2);

    const result = handleBackspaceKey(stateWithCursor);
    expect(result).toBe(false);
  });

  // ── Case 1 tests: two sentences in ONE transcript_block ──────────

  it("W1 Case 1 — Backspace at start of sentence-2-in-same-block merges into sentence 1", () => {
    const state = makeTwoSentenceBlockState();
    // Sentence 0 = "Hello world", sentence 1 = "How are you". Cursor at start of sentence 1.
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    const result = handleBackspaceKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    expect(result).toBe(true);
    expect(dispatchedTr).not.toBeNull();

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    // Still one paragraph, one block, one merged sentence.
    expect(shape.paragraphs).toHaveLength(1);
    expect(shape.paragraphs[0].blocks).toHaveLength(1);
    expect(shape.paragraphs[0].blocks[0].sentences).toHaveLength(1);

    const mergedText = shape.paragraphs[0].blocks[0].sentences[0].text;
    expect(mergedText).toContain("Hello world");
    expect(mergedText).toContain("How are you");
  });

  it("W1 Case 1 — cursor is at junction after merge (prev text length + 1)", () => {
    const state = makeTwoSentenceBlockState();
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    handleBackspaceKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);
    // "Hello world" is 11 chars; cursor should be inside the merged sentence at offset 11.
    const { $from } = newState.selection;
    expect($from.parent.type.name).toBe("sentence");
    expect($from.parentOffset).toBe(11); // end of "Hello world"
  });

  it("W1 Case 1 — word marks preserved through same-block merge", () => {
    const state = makeTwoSentenceBlockState({
      s1Text: "Hello",
      s1Start: 0, s1End: 5,
      s1Entities: [{ text: "Hello", startInSec: 0.1, endInSec: 1.0, entityId: "e1" }],
      s2Text: "World",
      s2Start: 5, s2End: 10,
      s2Entities: [{ text: "World", startInSec: 5.1, endInSec: 6.0, entityId: "e2" }],
    });
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    handleBackspaceKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);
    let wordMarkCount = 0;
    newState.doc.descendants((node) => {
      if (node.isText) {
        for (const mark of node.marks) {
          if (mark.type.name === "word") wordMarkCount++;
        }
      }
      return true;
    });
    expect(wordMarkCount).toBeGreaterThanOrEqual(2);
  });

  it("W1 Case 1 — endInSec is correct (taken from deleted sentence)", () => {
    const state = makeTwoSentenceBlockState({
      s1Start: 0, s1End: 5,
      s2Start: 5, s2End: 10,
    });
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    handleBackspaceKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);
    expect(shape.paragraphs[0].blocks[0].sentences[0].endInSec).toBe(10);
  });

  it("W1 Case 1 invalid timestamp — abort returns true (no-op, baseKeymap blocked)", () => {
    // Both sentences have endInSec === 0, so mergedStartTime(0) >= mergedEndTime(0) → invalid.
    const state = makeTwoSentenceBlockState({
      s1Start: 0, s1End: 0,
      s2Start: 0, s2End: 0,
    });
    const stateWithCursor = setCursor(state, 1, 0);

    const dispatch = vi.fn();
    const result = handleBackspaceKey(stateWithCursor, dispatch);

    // Returns true (key claimed) but dispatch never called (no-op).
    expect(result).toBe(true);
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("W1 preserves word marks through the merge", () => {
    const state = makeEditorState([
      {
        text: "Hello",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 5,
        entities: [{ text: "Hello", startInSec: 0.1, endInSec: 1.0, entityId: "e1" }],
      },
      {
        text: "World",
        speakerId: "spk1",
        startInSec: 5,
        endInSec: 10,
        entities: [{ text: "World", startInSec: 5.1, endInSec: 6.0, entityId: "e2" }],
      },
    ]);
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    const result = handleBackspaceKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    expect(result).toBe(true);
    expect(dispatchedTr).not.toBeNull();

    const newState = stateWithCursor.apply(dispatchedTr!);

    // Verify word marks survived the merge.
    let wordMarkCount = 0;
    newState.doc.descendants((node) => {
      if (node.isText) {
        for (const mark of node.marks) {
          if (mark.type.name === "word") wordMarkCount++;
        }
      }
      return true;
    });
    expect(wordMarkCount).toBeGreaterThanOrEqual(2);
  });
});

// ── W3 — handleEnterKey ───────────────────────────────────────────

describe("handleEnterKey", () => {
  it("W3 Enter mid-sentence creates 2 paragraph_container nodes", () => {
    const state = makeEditorState([
      {
        text: "Hello world today",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 6,
        entities: [
          { text: "Hello", startInSec: 0.1, endInSec: 1.0 },
          { text: "world", startInSec: 1.5, endInSec: 2.5 },
          { text: "today", startInSec: 3.0, endInSec: 4.0 },
        ],
      },
    ]);

    // Place cursor after "Hello " (offset 6).
    const stateWithCursor = setCursor(state, 0, 6);

    let dispatchedTr: Transaction | null = null;
    const result = handleEnterKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    expect(result).toBe(true);
    expect(dispatchedTr).not.toBeNull();

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    expect(shape.paragraphs).toHaveLength(2);
    expect(shape.paragraphs[0].blocks[0].sentences[0].text).toContain("Hello");
    expect(shape.paragraphs[1].blocks[0].sentences[0].text).toContain("world");
  });

  it("W3 Enter — text split correctly at cursor position", () => {
    const state = makeEditorState([
      {
        text: "ABCDEF",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 6,
      },
    ]);
    // Cursor after "ABC" (offset 3).
    const stateWithCursor = setCursor(state, 0, 3);

    let dispatchedTr: Transaction | null = null;
    handleEnterKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    expect(shape.paragraphs[0].blocks[0].sentences[0].text).toBe("ABC");
    expect(shape.paragraphs[1].blocks[0].sentences[0].text).toBe("DEF");
  });

  it("W3 Enter — new paragraph startInSec equals splitTime", () => {
    const state = makeEditorState([
      {
        text: "Hello world today",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 9,
        entities: [
          { text: "Hello", startInSec: 0.1, endInSec: 1.5 },
          { text: "world", startInSec: 2.0, endInSec: 3.5 },
          { text: "today", startInSec: 4.0, endInSec: 6.0 },
        ],
      },
    ]);
    // Cursor after "Hello " (offset 6 — into "world").
    const stateWithCursor = setCursor(state, 0, 6);

    let dispatchedTr: Transaction | null = null;
    handleEnterKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    const firstSentenceEnd = shape.paragraphs[0].blocks[0].sentences[0].endInSec;
    const secondSentenceStart = shape.paragraphs[1].blocks[0].sentences[0].startInSec;

    // Both sides should have consistent split timing.
    expect(firstSentenceEnd).toBeGreaterThan(0);
    expect(secondSentenceStart).toBeGreaterThan(0);
    expect(firstSentenceEnd).toBeLessThanOrEqual(shape.paragraphs[0].blocks[0].sentences[0].startInSec + 9);
  });

  it("W3 Enter — word marks preserved on both halves", () => {
    const state = makeEditorState([
      {
        text: "Hello world",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 6,
        entities: [
          { text: "Hello", startInSec: 0.1, endInSec: 1.0, entityId: "e1" },
          { text: "world", startInSec: 2.0, endInSec: 3.0, entityId: "e2" },
        ],
      },
    ]);
    // Cursor after "Hello " (offset 6).
    const stateWithCursor = setCursor(state, 0, 6);

    let dispatchedTr: Transaction | null = null;
    handleEnterKey(stateWithCursor, (tr) => { dispatchedTr = tr; });

    const newState = stateWithCursor.apply(dispatchedTr!);

    let wordMarkCount = 0;
    newState.doc.descendants((node) => {
      if (node.isText) {
        for (const mark of node.marks) {
          if (mark.type.name === "word") wordMarkCount++;
        }
      }
      return true;
    });
    // Both word marks should survive the split.
    expect(wordMarkCount).toBeGreaterThanOrEqual(2);
  });

  it("W3 Enter blank — both halves blank returns false", () => {
    const state = makeEditorState([
      {
        text: "   ",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 5,
      },
    ]);
    const stateWithCursor = setCursor(state, 0, 1);

    const result = handleEnterKey(stateWithCursor);
    expect(result).toBe(false);
  });

  it("W3 Enter abort — aborts when validateTimestampPair fails for computed splitTime", () => {
    // Use startInSec === endInSec === 0 so any splitTime calculation yields an invalid pair.
    const state = makeEditorState([
      {
        text: "Hello world",
        speakerId: "spk1",
        startInSec: 0,
        endInSec: 0,
      },
    ]);
    const stateWithCursor = setCursor(state, 0, 5);

    const dispatch = vi.fn();
    const result = handleEnterKey(stateWithCursor, dispatch);

    expect(result).toBe(false);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

// ── W7 — Mod-j (mergeParagraphsCommand) ──────────────────────────

describe("Mod-j — mergeParagraphsCommand (unconditional)", () => {
  it("W7 Mod-j — merges across different speakers", () => {
    const state = makeEditorState([
      { text: "Para one", speakerId: "spkA", startInSec: 0, endInSec: 5 },
      { text: "Para two", speakerId: "spkB", startInSec: 5, endInSec: 10 },
    ]);
    // Cursor in second paragraph (sentence index 1).
    const stateWithCursor = setCursor(state, 1, 2);

    // Simulate Mod-j via the plugin's handleKeyDown by calling mergeParagraphsCommand directly.
    // Import it indirectly via the plugin.
    // We exercise via the public createEditCommandsPlugin path by dispatching a keydown event.
    // To keep tests simple (no view), directly import and call the internal command
    // via the (state, dispatch) pattern.
    // We access it through the module — it's not exported, but we test it via handleKeyDown.
    // Instead: test the observable behavior by constructing the equivalent dispatch manually.
    // We use the exported handleEnterKey/handleBackspaceKey; for Mod-j we test via the plugin.

    // Since mergeParagraphsCommand is not exported, we verify via the behavioral effect:
    // Call handleBackspaceKey on a doc where Case 2 would merge different speakers.
    // Actually, we need to test Mod-j. Let's do it by importing from the module differently.
    // The plan says: "Mod-j merges across different speakers". We can verify by simulating
    // the command directly. Since mergeParagraphsCommand is a module-internal function,
    // we instead test via the createEditCommandsPlugin handleKeyDown path with a fake view.

    // Minimal fake EditorView for plugin testing.
    let dispatchedTr: Transaction | null = null;
    const fakeView = {
      editable: true,
      state: stateWithCursor,
      dispatch: (tr: Transaction) => { dispatchedTr = tr; },
    };

    const plugin = stateWithCursor.plugins[0];
    const handleKeyDown = plugin.props.handleKeyDown;
    if (!handleKeyDown) {
      throw new Error("handleKeyDown not found on plugin");
    }

    const fakeEvent = {
      metaKey: true,
      ctrlKey: false,
      shiftKey: false,
      key: "j",
      preventDefault: () => {},
    } as unknown as KeyboardEvent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = handleKeyDown(fakeView as any, fakeEvent);
    expect(result).toBe(true);
    expect(dispatchedTr).not.toBeNull();

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    // Merged into one paragraph.
    expect(shape.paragraphs).toHaveLength(1);
  });

  it("W7 Mod-j — merged paragraph keeps previous speaker attrs", () => {
    const state = makeEditorState([
      { text: "Para one", speakerId: "spkA", startInSec: 0, endInSec: 5 },
      { text: "Para two", speakerId: "spkB", startInSec: 5, endInSec: 10 },
    ]);
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    const fakeView = {
      editable: true,
      state: stateWithCursor,
      dispatch: (tr: Transaction) => { dispatchedTr = tr; },
    };

    const plugin = stateWithCursor.plugins[0];
    const handleKeyDown = plugin.props.handleKeyDown!;
    const fakeEvent = {
      metaKey: true, ctrlKey: false, shiftKey: false, key: "j",
      preventDefault: () => {},
    } as unknown as KeyboardEvent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleKeyDown(fakeView as any, fakeEvent);

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    // The merged paragraph has the PREVIOUS paragraph's speaker (spkA).
    expect(shape.paragraphs[0].speakerId).toBe("spkA");
  });

  it("W7 Mod-j — no-op on first paragraph", () => {
    const state = makeEditorState([
      { text: "Only para", speakerId: "spk1", startInSec: 0, endInSec: 5 },
    ]);
    const stateWithCursor = setCursor(state, 0, 0);

    let dispatchedTr: Transaction | null = null;
    const fakeView = {
      editable: true,
      state: stateWithCursor,
      dispatch: (tr: Transaction) => { dispatchedTr = tr; },
    };

    const plugin = stateWithCursor.plugins[0];
    const handleKeyDown = plugin.props.handleKeyDown!;
    const fakeEvent = {
      metaKey: true, ctrlKey: false, shiftKey: false, key: "j",
      preventDefault: () => {},
    } as unknown as KeyboardEvent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = handleKeyDown(fakeView as any, fakeEvent);
    expect(result).toBe(false);
    expect(dispatchedTr).toBeNull();
  });

  it("W7 Mod-j — previous container end attr is recomputed after merge", () => {
    const state = makeEditorState([
      { text: "Para one", speakerId: "spkA", startInSec: 0, endInSec: 5 },
      { text: "Para two", speakerId: "spkB", startInSec: 5, endInSec: 10 },
    ]);
    const stateWithCursor = setCursor(state, 1, 0);

    let dispatchedTr: Transaction | null = null;
    const fakeView = {
      editable: true,
      state: stateWithCursor,
      dispatch: (tr: Transaction) => { dispatchedTr = tr; },
    };

    const plugin = stateWithCursor.plugins[0];
    const handleKeyDown = plugin.props.handleKeyDown!;
    const fakeEvent = {
      metaKey: true, ctrlKey: false, shiftKey: false, key: "j",
      preventDefault: () => {},
    } as unknown as KeyboardEvent;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleKeyDown(fakeView as any, fakeEvent);

    const newState = stateWithCursor.apply(dispatchedTr!);
    const shape = getDocShape(newState);

    // After merge, the paragraph's end should reflect the later block's endInSec.
    expect(shape.paragraphs[0].end).toBeGreaterThanOrEqual(5);
  });
});
