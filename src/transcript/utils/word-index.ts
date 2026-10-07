/**
 * Word positions must match flattenWords() over the segments extractSegmentsFromDoc() saves: a block with word
 * marks counts only word-marked text, adjacent nodes with the same single word mark are one entity, a block without
 * word marks counts its whole text, and punctuation-only tokens are skipped.
 */

import type { Mark, Node as PMNode } from "prosemirror-model";
import { normalizeWord } from "@speakai/shared";

const TOKEN = /\S+/g;

/** A run of text saved as one entity: one `word` mark over contiguous text. */
export interface WordRun {
  text: string;
  /** Absolute doc position of the first character */
  from: number;
  /** Absolute doc position after the last character */
  to: number;
  mark: Mark;
}

export interface WordIndexBlock {
  /** Doc position before the transcript_block node */
  pos: number;
  /** Doc position after the transcript_block node */
  end: number;
  firstWord: number;
  lastWord: number;
}

export interface WordIndex {
  count: number;
  /** Doc position of each word's first character */
  starts: Int32Array;
  /** Doc position after each word's last character */
  ends: Int32Array;
  /** Index into `blocks` for each word */
  blockOf: Int32Array;
  /** Blocks that contain at least one word, in doc order */
  blocks: WordIndexBlock[];
}

interface TextPiece {
  text: string;
  pos: number;
  wordMarks: Mark[];
}

// Keyed by the immutable doc node, so the index is built once per doc and dropped on any change
const indexCache = new WeakMap<PMNode, WordIndex>();

/** Word index for `doc`, built on first use and cached for that doc. */
export function getWordIndex(doc: PMNode): WordIndex {
  const cached = indexCache.get(doc);
  if (cached) return cached;
  const index = buildWordIndex(doc);
  indexCache.set(doc, index);
  return index;
}

/** Shared with extractSegmentsFromDoc() so saved entities and word positions cannot drift apart. */
export function collectWordRuns(block: PMNode, blockPos: number): WordRun[] {
  const runs: WordRun[] = [];
  // A run can only be extended while it is the latest run and its mark is the node's only word mark
  let open: WordRun | null = null;

  for (const piece of textPieces(block, blockPos)) {
    const end = piece.pos + piece.text.length;
    if (piece.wordMarks.length === 0) {
      open = null;
      continue;
    }
    if (piece.wordMarks.length === 1 && open && open.to === piece.pos && open.mark.eq(piece.wordMarks[0])) {
      open.text += piece.text;
      open.to = end;
      continue;
    }
    // Several word marks on one node are saved as one entity each, so each counts on its own
    for (const mark of piece.wordMarks) {
      runs.push({ text: piece.text, from: piece.pos, to: end, mark });
    }
    open = piece.wordMarks.length === 1 ? runs[runs.length - 1] : null;
  }
  return runs;
}

/** Index of the first word that ends after `pos`, or `count` when none does. */
export function firstWordEndingAfter(index: WordIndex, pos: number): number {
  let lo = 0;
  let hi = index.count;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (index.ends[mid] > pos) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** Index of the first word that starts at or after `pos`, or `count` when none does. */
export function firstWordStartingAtOrAfter(index: WordIndex, pos: number): number {
  let lo = 0;
  let hi = index.count;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (index.starts[mid] >= pos) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

/** Inclusive word range touched by [from, to); a partly covered word counts whole, null when it holds no word. */
export function wordRangeBetween(
  index: WordIndex,
  from: number,
  to: number
): { start: number; end: number } | null {
  if (to <= from) return null;
  const start = firstWordEndingAfter(index, from);
  const end = firstWordStartingAtOrAfter(index, to) - 1;
  return start <= end ? { start, end } : null;
}

function buildWordIndex(doc: PMNode): WordIndex {
  const starts: number[] = [];
  const ends: number[] = [];
  const blockOf: number[] = [];
  const blocks: WordIndexBlock[] = [];

  const push = (from: number, to: number) => {
    starts.push(from);
    ends.push(to);
    blockOf.push(blocks.length);
  };

  doc.descendants((node, pos) => {
    if (node.type.name !== "transcript_block") return true;
    const firstWord = starts.length;
    const runs = collectWordRuns(node, pos);

    if (runs.length > 0) {
      for (const run of runs) {
        forEachToken(run.text, (offset, length) => push(run.from + offset, run.from + offset + length));
      }
    } else {
      pushPlainBlockWords(textPieces(node, pos), push);
    }

    if (starts.length > firstWord) {
      blocks.push({ pos, end: pos + node.nodeSize, firstWord, lastWord: starts.length - 1 });
    }
    return false;
  });

  return {
    count: starts.length,
    starts: Int32Array.from(starts),
    ends: Int32Array.from(ends),
    blockOf: Int32Array.from(blockOf),
    blocks,
  };
}

/** The save path joins text nodes with no separator, so tokens are found in the joined text. */
function pushPlainBlockWords(pieces: TextPiece[], push: (from: number, to: number) => void) {
  const offsets: number[] = [];
  let joined = "";
  for (const piece of pieces) {
    offsets.push(joined.length);
    joined += piece.text;
  }
  // Offsets only grow, so one forward-moving cursor maps them all
  let cursor = 0;
  const posAt = (offset: number) => {
    while (cursor < pieces.length - 1 && offsets[cursor + 1] <= offset) cursor++;
    return pieces[cursor].pos + (offset - offsets[cursor]);
  };
  forEachToken(joined, (offset, length) => {
    const from = posAt(offset);
    const to = posAt(offset + length - 1) + 1;
    push(from, to);
  });
}

function forEachToken(text: string, visit: (offset: number, length: number) => void) {
  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(text)) !== null) {
    if (normalizeWord(match[0]) !== "") visit(match.index, match[0].length);
  }
}

function textPieces(block: PMNode, blockPos: number): TextPiece[] {
  const pieces: TextPiece[] = [];
  block.descendants((child, childPos) => {
    if (!child.isText || !child.text) return true;
    pieces.push({
      text: child.text,
      // descendants() positions are relative to the block's content, which starts one past blockPos
      pos: blockPos + 1 + childPos,
      wordMarks: child.marks.filter((mark) => mark.type.name === "word"),
    });
    return true;
  });
  return pieces;
}
