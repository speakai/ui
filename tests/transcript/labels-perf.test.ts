/**
 * Labels plugin build time on a long call: ~1,900 timed sentences (~13k words) and 1,000 labels.
 * The bound is generous and the best of three runs is used so CI noise does not fail it;
 * the logged time is the number to watch.
 */

import { describe, it, expect } from "vitest";
import { EditorState } from "prosemirror-state";
import { AnchorStatus, LabelSource } from "@speakai/shared";
import type { ILabel, IMediaLabel } from "@speakai/shared";
import { createLabelsPlugin, labelsPluginKey, setLabels } from "../../src/transcript/plugins/labels";
import { getWordIndex } from "../../src/transcript/utils/word-index";
import { makeEditorState } from "./helpers";
import type { SegmentFixture } from "./helpers";

const SENTENCES = 1_900;
const WORDS_PER_SENTENCE = 7;
const MEDIA_LABELS = 1_000;
const BUILD_BUDGET_MS = 150;
const COLORS = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0d9488"];

function longCallSegments(): SegmentFixture[] {
  return Array.from({ length: SENTENCES }, (_, s) => {
    const words = Array.from({ length: WORDS_PER_SENTENCE }, (_, w) => `word${s}x${w}`);
    const start = s * 3;
    return {
      text: `${words.join(" ")}.`,
      startInSec: start,
      endInSec: start + 3,
      entities: words.map((text, w) => ({ text, startInSec: start + w * 0.4, endInSec: start + w * 0.4 + 0.4 })),
    };
  });
}

// Deterministic pseudo-random ranges so every run measures the same work
function seededLabels(wordCount: number): IMediaLabel[] {
  let seed = 42;
  const next = () => (seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31;
  return Array.from({ length: MEDIA_LABELS }, (_, i) => {
    const startWord = Math.floor(next() * (wordCount - 40));
    const endWord = startWord + Math.floor(next() * 40);
    const labelIds = next() < 0.2 ? [`l${i % COLORS.length}`, `l${(i + 1) % COLORS.length}`] : [`l${i % COLORS.length}`];
    return {
      _id: `ml${i}`, mediaLabelId: `ml${i}`, companyId: "c", userId: "u", mediaId: "m", labelIds,
      status: AnchorStatus.ACTIVE, createdAt: new Date(0), updatedAt: new Date(0),
      anchor: { startWord, endWord, exact: "", prefix: "", suffix: "", startInSec: 0, endInSec: 0, speakerIds: [], transcriptRevision: 0 },
    };
  });
}

const labels: ILabel[] = COLORS.map((color, i) => ({
  _id: `l${i}`, labelId: `l${i}`, companyId: "c", userId: "u", isGroup: false, name: `Label ${i}`, color,
  source: LabelSource.USER, isActive: true, createdAt: new Date(0), updatedAt: new Date(0),
}));

describe("labels plugin performance", () => {
  it(`builds the word index and decorations for ${MEDIA_LABELS} labels in under ${BUILD_BUDGET_MS} ms`, () => {
    const segments = longCallSegments();
    const measure = () => {
      // A fresh doc each run so the word index is built inside the timed section
      const doc = makeEditorState(segments).doc;
      let state = EditorState.create({ doc, plugins: [createLabelsPlugin()] });
      const view = { state, dispatch: (tr: import("prosemirror-state").Transaction) => { state = state.apply(tr); } };
      const mediaLabels = seededLabels(SENTENCES * WORDS_PER_SENTENCE);
      const started = performance.now();
      setLabels(view, { mediaLabels, labels, hiddenLabelIds: [], visible: true });
      const elapsed = performance.now() - started;
      return { elapsed, state };
    };

    measure(); // warm-up for the JIT
    // Best of three: parallel test files share the CPU, and the slowest run measures them, not us
    const runs = [measure(), measure(), measure()];
    const { elapsed, state } = runs.reduce((best, run) => (run.elapsed < best.elapsed ? run : best));
    const words = getWordIndex(state.doc).count;
    const drawn = labelsPluginKey.getState(state)!.decorations.find().length;
    console.info(`[labels perf] ${words} words, ${MEDIA_LABELS} labels, ${drawn} decorations: ${elapsed.toFixed(1)} ms`);

    expect(words).toBe(SENTENCES * WORDS_PER_SENTENCE);
    expect(drawn).toBeGreaterThan(MEDIA_LABELS);
    expect(elapsed).toBeLessThan(BUILD_BUDGET_MS);
  });
});
