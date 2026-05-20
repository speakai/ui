/**
 * ProseMirror test fixtures for transcript editing command tests.
 *
 * makeEditorState(segments) — builds a minimal EditorState from transcriptSchema
 * using the same node-construction pattern as speak-client build-doc.ts.
 *
 * setCursor(state, sentenceIndex, offset) — returns a new EditorState with the
 * cursor placed inside the nth sentence at the given char offset.
 *
 * getDocShape(state) — returns a plain-object representation of the doc for assertions.
 */

import { EditorState, TextSelection } from "prosemirror-state";
import { transcriptSchema } from "../../src/transcript/schema";
import { createEditCommandsPlugin } from "../../src/transcript/plugins/edit-commands";

export interface SegmentFixture {
  text: string;
  speakerId?: string;
  startInSec?: number;
  endInSec?: number;
  paragraphId?: number;
  sentenceId?: string;
  entities?: Array<{
    text: string;
    startInSec: number;
    endInSec: number;
    entityId?: string;
    confidence?: number;
    speakerId?: string;
  }>;
}

/**
 * Build an EditorState from an array of segment fixtures.
 * Each segment becomes: paragraph_container > transcript_block > sentence > text*.
 * If entities are provided, text nodes are annotated with word marks.
 */
export function makeEditorState(segments: SegmentFixture[]): EditorState {
  const schema = transcriptSchema;

  const paragraphs = segments.map((seg, i) => {
    const speakerId = String(seg.speakerId ?? "");
    const startInSec = seg.startInSec ?? 0;
    const endInSec = seg.endInSec ?? startInSec + 1;
    const paragraphId = seg.paragraphId ?? i + 1;
    const sentenceId = seg.sentenceId ?? String(i + 1);

    // Build inline content: either word-marked text nodes (if entities) or a plain text node.
    let inlineContent: import("prosemirror-model").Node[];
    if (seg.entities && seg.entities.length > 0) {
      inlineContent = buildWordMarkNodes(schema, seg.text, seg.entities);
    } else if (seg.text) {
      inlineContent = [schema.text(seg.text)];
    } else {
      inlineContent = [];
    }

    const sentence = schema.node("sentence", {
      sentenceId,
      speakerId,
      startInSec,
      endInSec,
    }, inlineContent);

    const block = schema.node("transcript_block", {
      paragraphId,
      sentenceId,
      speakerId,
      speaker: { name: speakerId ? `Speaker ${speakerId}` : "", userId: speakerId, speakerImg: "" },
      startInSec,
      endInSec,
      isParagraphStart: true,
    }, [sentence]);

    return schema.node("paragraph_container", {
      speakerId,
      speaker: { name: speakerId ? `Speaker ${speakerId}` : "", userId: speakerId, speakerImg: "" },
      paragraphId,
      start: startInSec,
      end: endInSec,
    }, [block]);
  });

  const doc = schema.node("doc", null, paragraphs);

  return EditorState.create({
    doc,
    plugins: [createEditCommandsPlugin()],
  });
}

/**
 * Build inline text nodes with word marks from entity array.
 * Entities are sorted by startInSec; text between entities gets no marks.
 */
function buildWordMarkNodes(
  schema: typeof transcriptSchema,
  fullText: string,
  entities: NonNullable<SegmentFixture["entities"]>
): import("prosemirror-model").Node[] {
  const nodes: import("prosemirror-model").Node[] = [];
  const wordMark = schema.marks["word"];

  // Map entity text positions in fullText.
  let pos = 0;
  for (const entity of entities) {
    const idx = fullText.indexOf(entity.text, pos);
    if (idx === -1) {
      // Can't locate — fall through to remaining text.
      continue;
    }
    // Text before this entity (no mark).
    if (idx > pos) {
      nodes.push(schema.text(fullText.substring(pos, idx)));
    }
    // Entity text with word mark.
    const mark = wordMark.create({
      entityId: entity.entityId ?? "",
      startInSec: entity.startInSec,
      endInSec: entity.endInSec,
      confidence: entity.confidence ?? 1,
      speakerId: entity.speakerId ?? "",
    });
    nodes.push(schema.text(entity.text).mark([mark]));
    pos = idx + entity.text.length;
  }
  // Remaining text (no mark).
  if (pos < fullText.length) {
    nodes.push(schema.text(fullText.substring(pos)));
  }
  return nodes.length > 0 ? nodes : [schema.text(fullText)];
}

/**
 * Return a new EditorState with cursor placed inside the nth sentence (0-indexed) at charOffset.
 * sentenceIndex counts all sentence nodes in document order.
 */
export function setCursor(
  state: EditorState,
  sentenceIndex: number,
  charOffset: number
): EditorState {
  const schema = state.schema;
  const sentenceType = schema.nodes["sentence"];
  let found = 0;
  let targetPos: number | null = null;

  state.doc.descendants((node, pos) => {
    if (targetPos !== null) return false;
    if (node.type === sentenceType) {
      if (found === sentenceIndex) {
        // pos is the position before the sentence node's open token.
        // pos + 1 is inside the sentence. Adding charOffset gives the cursor position.
        targetPos = pos + 1 + charOffset;
        return false;
      }
      found++;
    }
    return true;
  });

  if (targetPos === null) {
    throw new Error(`setCursor: sentence index ${sentenceIndex} not found`);
  }

  const clampedPos = Math.min(targetPos, state.doc.content.size);
  const tr = state.tr.setSelection(
    TextSelection.near(state.doc.resolve(Math.max(0, clampedPos)))
  );
  return state.apply(tr);
}

export interface SentenceShape {
  text: string;
  startInSec: number;
  endInSec: number;
  speakerId: string;
}

export interface BlockShape {
  sentences: SentenceShape[];
  startInSec: number;
  endInSec: number;
}

export interface ParagraphShape {
  speakerId: string;
  start: number;
  end: number;
  blocks: BlockShape[];
}

export interface DocShape {
  paragraphs: ParagraphShape[];
}

/**
 * Extract a plain-object shape from the editor doc for use in test assertions.
 */
export function getDocShape(state: EditorState): DocShape {
  const doc = state.doc;
  const paragraphs: ParagraphShape[] = [];

  doc.forEach((para) => {
    if (para.type.name !== "paragraph_container") return;
    const blocks: BlockShape[] = [];

    para.forEach((block) => {
      if (block.type.name !== "transcript_block") return;
      const sentences: SentenceShape[] = [];

      block.forEach((sentence) => {
        if (sentence.type.name !== "sentence") return;
        sentences.push({
          text: sentence.textContent,
          startInSec: sentence.attrs.startInSec,
          endInSec: sentence.attrs.endInSec,
          speakerId: sentence.attrs.speakerId,
        });
      });

      blocks.push({
        sentences,
        startInSec: block.attrs.startInSec,
        endInSec: block.attrs.endInSec,
      });
    });

    paragraphs.push({
      speakerId: para.attrs.speakerId,
      start: para.attrs.start,
      end: para.attrs.end,
      blocks,
    });
  });

  return { paragraphs };
}
