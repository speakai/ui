/**
 * Utility to extract ITranscriptSegment[] from a ProseMirror document.
 *
 * Used when saving edited transcripts — converts the ProseMirror doc
 * back into the API's segment format.
 */

import type { Node as PMNode, Schema } from "prosemirror-model";
import type { ITranscriptSegment, IWordEntity } from "@speakai/shared";

/**
 * Extract transcript segments from a ProseMirror document.
 * Walks the doc tree and rebuilds ITranscriptSegment[] from the node attributes.
 */
export function extractSegmentsFromDoc(doc: PMNode): ITranscriptSegment[] {
  const segments: ITranscriptSegment[] = [];
  let segmentIndex = 0;

  doc.descendants((node) => {
    if (node.type.name === "transcript_block") {
      const text = getBlockText(node);
      if (!text.trim()) return false;

      const entities = extractWordEntities(node);
      const startInSec = parseFloat(node.attrs.startInSec || node.attrs.startTime || "0");
      const endInSec = parseFloat(node.attrs.endInSec || node.attrs.endTime || "0");

      segments.push({
        id: segmentIndex,
        text: text.trim(),
        speakerId: node.attrs.speakerId || "0",
        confidence: 1,
        language: node.attrs.language || "",
        instances: [
          {
            start: formatTime(startInSec),
            end: formatTime(endInSec),
            startInSec,
            endInSec,
          },
        ],
        speaker: node.attrs.speaker || undefined,
        entities: entities.length > 0 ? entities : undefined,
      });

      segmentIndex++;
      return false; // Don't descend further
    }
    return true;
  });

  return segments;
}

/**
 * Get the full text content of a transcript_block node.
 */
function getBlockText(node: PMNode): string {
  let text = "";
  node.descendants((child) => {
    if (child.isText) {
      text += child.text;
    }
    return true;
  });
  return text;
}

/**
 * Extract word-level entities from a transcript_block node's marks.
 */
function extractWordEntities(node: PMNode): IWordEntity[] {
  const entities: IWordEntity[] = [];

  node.descendants((child) => {
    if (child.isText && child.marks.length > 0) {
      for (const mark of child.marks) {
        if (mark.type.name === "word") {
          entities.push({
            id: mark.attrs.entityId || undefined,
            text: child.text || "",
            speakerId: mark.attrs.speakerId || "",
            confidence: parseFloat(mark.attrs.confidence || "1"),
            instances: {
              startInSec: parseFloat(mark.attrs.startInSec || "0"),
              endInSec: parseFloat(mark.attrs.endInSec || "0"),
            },
          });
        }
      }
    }
    return true;
  });

  return entities;
}

/**
 * Format seconds into H:MM:SS string for instances.
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Returns true when [start, end] is a valid, ordered, finite, non-negative time pair. */
export function validateTimestampPair(start: number, end: number): boolean {
  // Number.isFinite rejects NaN AND Infinity — parseFloat("") → NaN would
  // otherwise slip past the negativity check and corrupt segment timing on save.
  if (!Number.isFinite(start) || !Number.isFinite(end)) return false;
  if (start < 0 || end < 0) return false;
  if (start >= end) return false;
  return true;
}

/**
 * Slice a sentence node's text-node children to [fromOffset, toOffset), preserving marks.
 * When `remap` is supplied, proportionally re-times `word` mark startInSec/endInSec into
 * the new range. Returns [schema.text(" ")] when the slice is empty.
 *
 * Port of Angular extractTextNodesWithMarks (transcript-editor.service.ts:461-601).
 */
export function splitTextNodesWithMarks(
  sentence: PMNode,
  fromOffset: number,
  toOffset: number,
  schema: Schema,
  remap?: { origStart: number; origEnd: number; newStart: number; newEnd: number }
): PMNode[] {
  const nodes: PMNode[] = [];
  let currentPos = 0;
  let minMarkStart = Number.POSITIVE_INFINITY;
  let maxMarkEnd = Number.NEGATIVE_INFINITY;

  // Pass 1: slice text nodes to [fromOffset, toOffset), copy marks as-is, track word-mark range.
  sentence.forEach((textNode) => {
    if (!textNode.isText) return;

    const textLength = textNode.text!.length;
    const textEnd = currentPos + textLength;

    if (textEnd <= fromOffset || currentPos >= toOffset) {
      currentPos = textEnd;
      return;
    }

    // Guaranteed non-negative intersection via Math.max/min (AEGIS#2).
    const sliceStart = Math.max(0, fromOffset - currentPos);
    const sliceEnd = Math.min(textLength, toOffset - currentPos);
    const slicedText = textNode.text!.substring(sliceStart, sliceEnd);

    if (slicedText.length > 0) {
      const newTextNode = schema.text(slicedText);
      if (textNode.marks && textNode.marks.length > 0) {
        // Track word-mark timing range for Pass 2.
        for (const mark of textNode.marks) {
          if (mark.type.name === "word") {
            const mStart = typeof mark.attrs.startInSec === "number" ? mark.attrs.startInSec : parseFloat(mark.attrs.startInSec ?? "0") || 0;
            const mEnd = typeof mark.attrs.endInSec === "number" ? mark.attrs.endInSec : parseFloat(mark.attrs.endInSec ?? "0") || mStart;
            if (mStart < minMarkStart) minMarkStart = mStart;
            if (mEnd > maxMarkEnd) maxMarkEnd = mEnd;
          }
        }
        nodes.push(newTextNode.mark(textNode.marks));
      } else {
        nodes.push(newTextNode);
      }
    }

    currentPos = textEnd;
  });

  // Pass 2: re-time word marks proportionally when remap is supplied.
  if (nodes.length > 0 && remap !== undefined) {
    // Compute effective ranges with Angular's fallback chain (:526-558).
    const effectiveOriginalStart =
      remap.origStart !== undefined
        ? remap.origStart
        : minMarkStart !== Number.POSITIVE_INFINITY
          ? minMarkStart
          : undefined;
    const effectiveOriginalEnd =
      remap.origEnd !== undefined
        ? remap.origEnd
        : maxMarkEnd !== Number.NEGATIVE_INFINITY
          ? maxMarkEnd
          : effectiveOriginalStart;
    const effectiveNewStart =
      remap.newStart !== undefined
        ? remap.newStart
        : effectiveOriginalStart !== undefined
          ? effectiveOriginalStart
          : undefined;
    const effectiveNewEnd =
      remap.newEnd !== undefined
        ? remap.newEnd
        : effectiveOriginalEnd !== undefined
          ? effectiveOriginalEnd
          : effectiveNewStart;

    if (
      effectiveOriginalStart !== undefined &&
      effectiveOriginalEnd !== undefined &&
      effectiveNewStart !== undefined &&
      effectiveNewEnd !== undefined &&
      // Identity-range guard (:557) — remap fires only when range is non-zero OR new range is zero.
      (effectiveOriginalEnd - effectiveOriginalStart !== 0 || effectiveNewEnd === effectiveNewStart)
    ) {
      const oldRange = Math.max(effectiveOriginalEnd - effectiveOriginalStart, 1e-6);
      const newRange = effectiveNewEnd - effectiveNewStart;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node.marks || node.marks.length === 0) continue;

        const remappedMarks = node.marks.map((mark) => {
          if (mark.type.name !== "word") return mark;

          const a = mark.attrs;
          const origStart = typeof a.startInSec === "number" ? a.startInSec : parseFloat(a.startInSec ?? "0") || (effectiveOriginalStart ?? 0);
          const origEnd = typeof a.endInSec === "number" ? a.endInSec : parseFloat(a.endInSec ?? "0") || origStart;

          const startRatio = (origStart - (effectiveOriginalStart ?? 0)) / oldRange;
          const endRatio = (origEnd - (effectiveOriginalStart ?? 0)) / oldRange;

          const newStart = (effectiveNewStart ?? 0) + startRatio * newRange;
          const newEnd = (effectiveNewStart ?? 0) + endRatio * newRange;

          // Prototype-safe explicit attr pick (AEGIS#1) — never spread untrusted mark.attrs.
          return mark.type.create({
            entityId: a.entityId,
            startInSec: newStart,
            endInSec: newEnd,
            confidence: a.confidence,
            speakerId: a.speakerId,
          });
        });

        nodes[i] = node.mark(remappedMarks);
      }
    }
  }

  // Empty result → return a single space (ProseMirror rejects empty sentence content, :596).
  if (nodes.length === 0) {
    return [schema.text(" ")];
  }

  return nodes;
}
