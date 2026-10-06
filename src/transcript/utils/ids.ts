/**
 * Id helpers for transcript documents.
 *
 * Segment ids (transcript_block / sentence `sentenceId`) are numeric in the API
 * and are what clips, insights and labels anchor to, so every id minted in the
 * editor must be a whole number that no other segment in the doc already uses.
 */

import type { Node as PMNode } from "prosemirror-model";

/**
 * Reads an id attr as a whole number, or null when it is missing or not numeric.
 * Number("") is 0, so blank values are rejected explicitly instead of becoming id 0.
 */
export function parseNumericId(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/** Largest numeric value of `attr` on nodes named in `typeNames`, or -1 when none exist. */
function maxNumericAttr(doc: PMNode, typeNames: string[], attr: string): number {
  let max = -1;
  doc.descendants((node) => {
    if (typeNames.includes(node.type.name)) {
      const id = parseNumericId(node.attrs[attr]);
      if (id !== null && id > max) max = id;
    }
    return true;
  });
  return max;
}

/** Highest segment id in the doc, read from both blocks and sentences, or -1 when none. */
export function maxSentenceId(doc: PMNode): number {
  return maxNumericAttr(doc, ["transcript_block", "sentence"], "sentenceId");
}

/** Highest paragraph id in the doc, or 0 when none (paragraph ids start at 1). */
export function maxParagraphId(doc: PMNode): number {
  return Math.max(0, maxNumericAttr(doc, ["paragraph_container", "transcript_block"], "paragraphId"));
}
