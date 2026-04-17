/**
 * ProseMirror schema for transcript documents.
 *
 * Structure: doc → paragraph_container+ → transcript_block+ → sentence+ → text*
 * Mark: word (word-level time tracking)
 *
 * Ported from Angular speak-client transcript.schema.ts.
 * Used by both TranscriptViewer (editable: false) and TranscriptEditor (editable: true).
 */

import { Schema } from "prosemirror-model";
import type { DOMOutputSpec, NodeSpec, MarkSpec } from "prosemirror-model";

// ── Paragraph Container ───────────────────────────────────────────

const paragraphContainerSpec: NodeSpec = {
  content: "transcript_block+",
  group: "block",
  attrs: {
    speakerId: { default: "" },
    speaker: { default: {} },
    language: { default: "" },
    paragraphId: { default: 1 },
    isEntity: { default: false },
    start: { default: 0 },
    end: { default: 0 },
  },
  toDOM(node): DOMOutputSpec {
    const speakerName =
      node.attrs.speaker?.name || node.attrs.speakerId || "";
    const speakerIndex = String((Number(node.attrs.paragraphId ?? 1) - 1) % 6);
    const words = speakerName.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? (words[0][0] ?? "") + (words[1][0] ?? "")
        : speakerName.slice(0, 2);
    return [
      "div",
      {
        class: "transcript-paragraph",
        "data-para-speaker-id": node.attrs.speakerId || "",
        "data-para-speaker-name": speakerName,
        "data-para-id": String(node.attrs.paragraphId || ""),
        "data-para-start": String(node.attrs.start || 0),
        "data-para-end": String(node.attrs.end || 0),
        "data-speaker-index": speakerIndex,
        "data-speaker-initials": initials.toUpperCase(),
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "div.transcript-paragraph",
      getAttrs(dom) {
        const el = dom as HTMLElement;
        return {
          speakerId: el.getAttribute("data-para-speaker-id") || "",
          paragraphId: el.getAttribute("data-para-id") || "",
          start: el.getAttribute("data-para-start") || "0",
          end: el.getAttribute("data-para-end") || "0",
        };
      },
    },
  ],
};

// ── Transcript Block ──────────────────────────────────────────────

const transcriptBlockSpec: NodeSpec = {
  content: "sentence+",
  group: "block",
  selectable: false,
  draggable: false,
  isolating: true,
  attrs: {
    paragraphId: { default: 1 },
    sentenceId: { default: 1 },
    speakerId: { default: "" },
    speaker: { default: {} },
    text: { default: "" },
    startInSec: { default: 0 },
    endInSec: { default: 0 },
    startTime: { default: 0 },
    endTime: { default: 0 },
    selected: { default: false },
    isParagraphStart: { default: true },
    isLastSentence: { default: false },
    language: { default: "" },
    entities: { default: [] },
  },
  toDOM(node): DOMOutputSpec {
    const speakerName =
      node.attrs.speaker?.name || node.attrs.speakerId || "";
    let className = "transcript-block";
    if (node.attrs.selected) className += " selected-segment";
    if (node.attrs.isParagraphStart) className += " paragraph-start";
    if (node.attrs.isLastSentence) className += " last-sentence";

    return [
      "div",
      {
        class: className,
        "data-para-id": String(node.attrs.paragraphId || ""),
        "data-sentence-id": String(node.attrs.sentenceId || ""),
        "data-start": String(node.attrs.startInSec || node.attrs.startTime || 0),
        "data-end": String(node.attrs.endInSec || node.attrs.endTime || 0),
        "data-speaker-id": node.attrs.speakerId || "",
        "data-speaker-name": speakerName,
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "div.transcript-block",
      getAttrs(dom) {
        const el = dom as HTMLElement;
        return {
          paragraphId: el.getAttribute("data-para-id") || "",
          sentenceId: el.getAttribute("data-sentence-id") || "",
          startInSec: el.getAttribute("data-start") || "0",
          endInSec: el.getAttribute("data-end") || "0",
          speakerId: el.getAttribute("data-speaker-id") || "",
          selected: el.classList.contains("selected-segment"),
          isParagraphStart: el.classList.contains("paragraph-start"),
          isLastSentence: el.classList.contains("last-sentence"),
        };
      },
    },
  ],
};

// ── Sentence ──────────────────────────────────────────────────────

const sentenceSpec: NodeSpec = {
  content: "text*",
  group: "sentence",
  inline: false,
  selectable: true,
  attrs: {
    sentenceId: { default: "" },
    speakerId: { default: "" },
    startInSec: { default: 0 },
    endInSec: { default: 0 },
    startTime: { default: 0 },
    endTime: { default: 0 },
    selected: { default: false },
  },
  toDOM(node): DOMOutputSpec {
    let className = "transcript-text";
    if (node.attrs.selected) className += " selected";

    return [
      "span",
      {
        class: className,
        "data-sentence-id": node.attrs.sentenceId || "",
        "data-start": String(node.attrs.startInSec || 0),
        "data-end": String(node.attrs.endInSec || 0),
        "data-speaker-id": node.attrs.speakerId || "",
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "span.transcript-text",
      getAttrs(dom) {
        const el = dom as HTMLElement;
        return {
          sentenceId: el.getAttribute("data-sentence-id") || "",
          startInSec: el.getAttribute("data-start") || "0",
          endInSec: el.getAttribute("data-end") || "0",
          speakerId: el.getAttribute("data-speaker-id") || "",
          selected: el.classList.contains("selected"),
        };
      },
    },
  ],
};

// ── Word Mark ─────────────────────────────────────────────────────

const wordMarkSpec: MarkSpec = {
  attrs: {
    entityId: { default: "" },
    startInSec: { default: 0 },
    endInSec: { default: 0 },
    confidence: { default: 1 },
    speakerId: { default: "" },
  },
  inclusive: false,
  excludes: "",
  toDOM(mark): DOMOutputSpec {
    return [
      "span",
      {
        class: "transcript-word",
        "data-entity-id": mark.attrs.entityId || "",
        "data-word-start": String(mark.attrs.startInSec || 0),
        "data-word-end": String(mark.attrs.endInSec || 0),
        "data-confidence": String(mark.attrs.confidence || 1),
        "data-speaker-id": mark.attrs.speakerId || "",
      },
      0,
    ];
  },
  parseDOM: [
    {
      tag: "span.transcript-word",
      getAttrs(node) {
        const el = node as HTMLElement;
        return {
          entityId: el.getAttribute("data-entity-id") || "",
          startInSec: el.getAttribute("data-word-start") || "0",
          endInSec: el.getAttribute("data-word-end") || "0",
          confidence: el.getAttribute("data-confidence") || "1",
          speakerId: el.getAttribute("data-speaker-id") || "",
        };
      },
    },
  ],
};

// ── Schema ────────────────────────────────────────────────────────

export const transcriptSchema = new Schema({
  nodes: {
    doc: { content: "paragraph_container+" },
    paragraph_container: paragraphContainerSpec,
    transcript_block: transcriptBlockSpec,
    sentence: sentenceSpec,
    text: {},
  },
  marks: {
    word: wordMarkSpec,
  },
});
