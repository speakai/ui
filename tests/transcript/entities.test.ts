/**
 * Unit tests for validateTimestampPair and splitTextNodesWithMarks.
 * C7 from the transcript-parity-speak-ui plan.
 */

import { describe, it, expect } from "vitest";
import {
  validateTimestampPair,
  splitTextNodesWithMarks,
  extractSegmentsFromDoc,
} from "../../src/transcript/utils/entities";
import { transcriptSchema } from "../../src/transcript/schema";

const schema = transcriptSchema;
const wordMark = schema.marks["word"];

// ── validateTimestampPair ─────────────────────────────────────────

describe("validateTimestampPair", () => {
  it("returns false for negative start", () => {
    expect(validateTimestampPair(-1, 5)).toBe(false);
  });

  it("returns false for negative end", () => {
    expect(validateTimestampPair(0, -1)).toBe(false);
  });

  it("returns false when start >= end (start > end)", () => {
    expect(validateTimestampPair(10, 5)).toBe(false);
  });

  it("returns false when start === end", () => {
    expect(validateTimestampPair(5, 5)).toBe(false);
  });

  it("returns false for NaN start (AEGIS#3 regression)", () => {
    expect(validateTimestampPair(NaN, 5)).toBe(false);
  });

  it("returns false for NaN end (AEGIS#3 regression)", () => {
    expect(validateTimestampPair(0, NaN)).toBe(false);
  });

  it("returns false for Infinity start (AEGIS#3 regression)", () => {
    expect(validateTimestampPair(Infinity, 5)).toBe(false);
  });

  it("returns false for Infinity end (AEGIS#3 regression)", () => {
    expect(validateTimestampPair(0, Infinity)).toBe(false);
  });

  it("returns false for -Infinity", () => {
    expect(validateTimestampPair(-Infinity, 5)).toBe(false);
  });

  it("returns true for a valid ordered pair", () => {
    expect(validateTimestampPair(0, 5)).toBe(true);
  });

  it("returns true for a valid pair with decimals", () => {
    expect(validateTimestampPair(1.5, 2.7)).toBe(true);
  });

  it("returns true when start is 0 and end is positive", () => {
    expect(validateTimestampPair(0, 0.001)).toBe(true);
  });
});

// ── splitTextNodesWithMarks ───────────────────────────────────────

describe("splitTextNodesWithMarks", () => {
  /**
   * Build a sentence node from text + optional word entities.
   */
  function makeSentence(
    text: string,
    entities?: Array<{ text: string; startInSec: number; endInSec: number; entityId?: string }>
  ) {
    const sentenceType = schema.nodes["sentence"];

    if (!entities || entities.length === 0) {
      return sentenceType.create({}, text ? [schema.text(text)] : []);
    }

    // Build marked text nodes.
    const nodes: import("prosemirror-model").Node[] = [];
    let pos = 0;
    for (const entity of entities) {
      const idx = text.indexOf(entity.text, pos);
      if (idx === -1) continue;
      if (idx > pos) {
        nodes.push(schema.text(text.substring(pos, idx)));
      }
      const mark = wordMark.create({
        entityId: entity.entityId ?? "",
        startInSec: entity.startInSec,
        endInSec: entity.endInSec,
        confidence: 1,
        speakerId: "",
      });
      nodes.push(schema.text(entity.text).mark([mark]));
      pos = idx + entity.text.length;
    }
    if (pos < text.length) {
      nodes.push(schema.text(text.substring(pos)));
    }
    return sentenceType.create({}, nodes.length > 0 ? nodes : [schema.text(text)]);
  }

  it("returns a single space node for an empty slice (out-of-range fromOffset >= toOffset)", () => {
    const sentence = makeSentence("Hello");
    // Request slice [10, 20) — entirely outside "Hello" (length 5).
    const result = splitTextNodesWithMarks(sentence, 10, 20, schema);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe(" ");
  });

  it("returns a single space node when fromOffset === toOffset (zero-length slice)", () => {
    const sentence = makeSentence("Hello");
    const result = splitTextNodesWithMarks(sentence, 2, 2, schema);
    expect(result).toHaveLength(1);
    expect(result[0].text).toBe(" ");
  });

  it("slices plain text correctly", () => {
    const sentence = makeSentence("Hello world");
    const result = splitTextNodesWithMarks(sentence, 0, 5, schema);
    const text = result.map(n => n.text ?? "").join("");
    expect(text).toBe("Hello");
  });

  it("slices a straddling text node correctly", () => {
    const sentence = makeSentence("Hello world");
    // Slice [3, 8) → "lo wo"
    const result = splitTextNodesWithMarks(sentence, 3, 8, schema);
    const text = result.map(n => n.text ?? "").join("");
    expect(text).toBe("lo wo");
  });

  it("preserves word marks on sliced text nodes", () => {
    const sentence = makeSentence("Hello world", [
      { text: "Hello", startInSec: 0.1, endInSec: 1.0 },
      { text: "world", startInSec: 1.5, endInSec: 2.5 },
    ]);

    // Slice only the "Hello" portion [0, 5).
    const result = splitTextNodesWithMarks(sentence, 0, 5, schema);
    const wordMarks = result.flatMap(n => n.marks.filter(m => m.type.name === "word"));
    expect(wordMarks.length).toBeGreaterThan(0);
  });

  it("remap re-times word marks proportionally — exact numbers", () => {
    // Sentence: "Hello" (5 chars) with word mark [0.0, 2.0].
    // Slice [0, 5) with remap { origStart: 0, origEnd: 10, newStart: 5, newEnd: 10 }.
    // Expected: mark remapped proportionally into [5, 10].
    // startRatio = (0 - 0) / 10 = 0.0 → newStart = 5 + 0 * 5 = 5.0
    // endRatio   = (2 - 0) / 10 = 0.2 → newEnd   = 5 + 0.2 * 5 = 6.0
    const sentence = makeSentence("Hello", [
      { text: "Hello", startInSec: 0.0, endInSec: 2.0 },
    ]);

    const result = splitTextNodesWithMarks(sentence, 0, 5, schema, {
      origStart: 0,
      origEnd: 10,
      newStart: 5,
      newEnd: 10,
    });

    const wordMarks = result.flatMap(n => n.marks.filter(m => m.type.name === "word"));
    expect(wordMarks.length).toBe(1);
    expect(wordMarks[0].attrs.startInSec).toBeCloseTo(5.0, 5);
    expect(wordMarks[0].attrs.endInSec).toBeCloseTo(6.0, 5);
  });

  it("identity-range guard suppresses spurious remap when origStart === origEnd", () => {
    // origStart === origEnd (range = 0) but newEnd !== newStart → guard suppresses remap.
    const sentence = makeSentence("Hello", [
      { text: "Hello", startInSec: 3.0, endInSec: 4.0 },
    ]);

    const result = splitTextNodesWithMarks(sentence, 0, 5, schema, {
      origStart: 5,
      origEnd: 5, // zero range → guard fires
      newStart: 2,
      newEnd: 8,
    });

    const wordMarks = result.flatMap(n => n.marks.filter(m => m.type.name === "word"));
    // Marks still present but not remapped (guard suppressed remap).
    // Original mark attrs should be unchanged.
    expect(wordMarks.length).toBe(1);
    expect(wordMarks[0].attrs.startInSec).toBe(3.0);
    expect(wordMarks[0].attrs.endInSec).toBe(4.0);
  });

  it("no remap when remap is undefined — marks copied as-is", () => {
    const sentence = makeSentence("Hello world", [
      { text: "Hello", startInSec: 1.0, endInSec: 2.0 },
    ]);

    const result = splitTextNodesWithMarks(sentence, 0, 5, schema);

    const wordMarks = result.flatMap(n => n.marks.filter(m => m.type.name === "word"));
    expect(wordMarks.length).toBeGreaterThan(0);
    // Mark times should be unchanged.
    expect(wordMarks[0].attrs.startInSec).toBe(1.0);
    expect(wordMarks[0].attrs.endInSec).toBe(2.0);
  });

  it("marks preserved on both halves when straddling a word boundary", () => {
    const sentence = makeSentence("Hello world", [
      { text: "Hello", startInSec: 0.1, endInSec: 1.0 },
      { text: "world", startInSec: 1.5, endInSec: 2.5 },
    ]);

    // First half [0, 6) → "Hello ".
    const firstHalf = splitTextNodesWithMarks(sentence, 0, 6, schema);
    const firstMarks = firstHalf.flatMap(n => n.marks.filter(m => m.type.name === "word"));

    // Second half [6, 11) → "world".
    const secondHalf = splitTextNodesWithMarks(sentence, 6, 11, schema);
    const secondMarks = secondHalf.flatMap(n => n.marks.filter(m => m.type.name === "word"));

    expect(firstMarks.length).toBeGreaterThan(0);
    expect(secondMarks.length).toBeGreaterThan(0);
  });
});

// ── extractSegmentsFromDoc — speaker payload parity with Angular ───

describe("extractSegmentsFromDoc speaker", () => {
  function docWith(blocks: Array<{ text: string; speaker?: Record<string, unknown> }>) {
    return schema.node("doc", {}, [
      schema.node(
        "paragraph_container",
        { speakerId: "0" },
        blocks.map((b) =>
          schema.node(
            "transcript_block",
            { speakerId: "0", speaker: b.speaker ?? {}, startInSec: 0, endInSec: 1 },
            [schema.node("sentence", {}, [schema.text(b.text)])]
          )
        )
      ),
    ]);
  }

  it("omits speaker when the node attr is an empty object (matches Angular payload)", () => {
    const [seg] = extractSegmentsFromDoc(docWith([{ text: "Hello world" }]));
    expect(seg.speaker).toBeUndefined();
  });

  it("keeps speaker when it has a userId", () => {
    const speaker = { userId: "u1", name: "Alice" };
    const [seg] = extractSegmentsFromDoc(docWith([{ text: "Hello world", speaker }]));
    expect(seg.speaker).toEqual(speaker);
  });
});
