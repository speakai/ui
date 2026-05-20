/**
 * ProseMirror plugin for transcript-specific editing commands.
 *
 * Commands:
 * - Mod-j          → merge current paragraph_container with previous (unconditional)
 * - Mod-Shift-d    → duplicate current paragraph_container, place after, move cursor
 * - Backspace      → merge sentence/paragraph at sentence boundary
 * - Enter          → split sentence at cursor, creating a new paragraph_container
 * - Tab            → jump cursor to next sentence
 *
 * Schema hierarchy: doc > paragraph_container > transcript_block > sentence > text*
 */

import { Plugin, TextSelection } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";
import { validateTimestampPair, splitTextNodesWithMarks } from "../utils/entities";

// ── Helpers ───────────────────────────────────────────────────────

function isMod(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

/**
 * Walk up the resolve path to find a node of the given type name.
 * Returns { node, pos, depth } or null.
 */
function findAncestorOfType(
  state: EditorState,
  typeName: string
): { node: import("prosemirror-model").Node; pos: number; depth: number } | null {
  const { $from } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type.name === typeName) {
      return { node, pos: $from.before(d), depth: d };
    }
  }
  return null;
}

// ── Commands ──────────────────────────────────────────────────────

/** Merge current paragraph_container into the previous one (unconditional — Angular parity). */
function mergeParagraphsCommand(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const current = findAncestorOfType(state, "paragraph_container");
  if (!current) return false;

  // Find the node just before the current paragraph_container
  const { doc } = state;
  const prevEnd = current.pos;
  if (prevEnd === 0) return false;

  // Resolve position just before current paragraph_container
  const $prevEnd = doc.resolve(prevEnd - 1);
  let prevDepth = $prevEnd.depth;
  while (prevDepth > 0 && $prevEnd.node(prevDepth).type.name !== "paragraph_container") {
    prevDepth--;
  }
  const prevNode = $prevEnd.node(prevDepth);
  if (prevNode.type.name !== "paragraph_container") return false;

  // Mod-j merges unconditionally (Angular parity); merged paragraph
  // keeps the previous paragraph's speaker attrs.
  if (!dispatch) return true;

  const prevPos = $prevEnd.before(prevDepth);

  // Collect all transcript_block children from current paragraph_container
  const tr = state.tr;
  const insertPos = prevPos + prevNode.nodeSize - 1; // inside prevNode, before closing

  const children: import("prosemirror-model").Node[] = [];
  current.node.forEach((child) => children.push(child));

  tr.delete(current.pos, current.pos + current.node.nodeSize);

  let offset = 0;
  for (const child of children) {
    tr.insert(insertPos + offset, child);
    offset += child.nodeSize;
  }

  // Recompute the previous paragraph_container's start/end attrs. The transplant ran
  // tr.delete + tr.insert which shifts positions — re-map before setNodeMarkup.
  const mappedPrevPos = tr.mapping.map(prevPos);
  const updatedPrevNode = tr.doc.nodeAt(mappedPrevPos);
  if (updatedPrevNode && updatedPrevNode.type.name === "paragraph_container") {
    let blockStart: number | null = null;
    let blockEnd: number | null = null;
    updatedPrevNode.forEach((block) => {
      const bStart = typeof block.attrs.startInSec === "number" ? block.attrs.startInSec : parseFloat(block.attrs.startInSec || "0");
      const bEnd = typeof block.attrs.endInSec === "number" ? block.attrs.endInSec : parseFloat(block.attrs.endInSec || "0");
      if (blockStart === null || bStart < blockStart) blockStart = bStart;
      if (blockEnd === null || bEnd > blockEnd) blockEnd = bEnd;
    });
    if (blockStart !== null && blockEnd !== null) {
      tr.setNodeMarkup(mappedPrevPos, undefined, {
        ...updatedPrevNode.attrs,
        start: blockStart,
        end: blockEnd,
      });
    }
  }

  dispatch(tr.scrollIntoView());
  return true;
}

/** Duplicate the current paragraph_container and insert it after, moving cursor into the copy. */
function duplicateParagraphCommand(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const current = findAncestorOfType(state, "paragraph_container");
  if (!current) return false;

  if (!dispatch) return true;

  const copy = current.node.copy(current.node.content);
  const insertAt = current.pos + current.node.nodeSize;

  const tr = state.tr.insert(insertAt, copy);

  // Place cursor at the start of the new paragraph_container
  const newPos = insertAt + 2; // skip outer node + first transcript_block open tag
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(newPos, tr.doc.content.size - 1))));

  dispatch(tr.scrollIntoView());
  return true;
}

/**
 * Handle Backspace at a sentence boundary — merges sentences/paragraphs preserving word marks.
 *
 * Port of Angular enhancedKeymap Backspace (transcript-editor.service.ts:604-821).
 * Two cases:
 *   Case 1 — sentenceIndexInBlock > 0: merge with previous sibling sentence in same block.
 *   Case 2 — sentenceIndexInBlock === 0: merge first sentence of block into last sentence of
 *             previous paragraph_container (collapsing to a single block per Angular :797-799).
 *
 * view.editable is checked at the call site in handleKeyDown.
 */
export function handleBackspaceKey(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection, schema } = state;

  // Pre-dispatch guard 1: non-empty selection → defer to baseKeymap.
  if (!selection.empty) return false;

  const { $from } = selection;

  // Pre-dispatch guard 2: boundary test — only fire at the start of a sentence node.
  // parentOffset 1 is included because ProseMirror counts the opening token as position 0.
  if (!($from.parent.type.name === "sentence" && ($from.parentOffset === 0 || $from.parentOffset === 1))) return false;

  // Resolve sentence, block, paragraph nodes and positions.
  let sentenceNode: import("prosemirror-model").Node | null = null;
  let sentencePos: number | null = null;
  let blockNode: import("prosemirror-model").Node | null = null;
  let paragraphNode: import("prosemirror-model").Node | null = null;
  let paragraphPos: number | null = null;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "sentence" && !sentenceNode) {
      sentenceNode = node;
      sentencePos = $from.before(depth);
    } else if (node.type.name === "transcript_block" && !blockNode) {
      blockNode = node;
    } else if (node.type.name === "paragraph_container" && !paragraphNode) {
      paragraphNode = node;
      paragraphPos = $from.before(depth);
    }
  }

  // Pre-dispatch guard 3: sentencePos === 0 means the sentence opens at doc position 0 — nothing to merge into.
  if (!sentenceNode || sentencePos === null || sentencePos === 0) return false;
  if (!blockNode || !paragraphNode || paragraphPos === null) return false;

  const $sentencePos = state.doc.resolve(sentencePos);
  const parentBlock = $sentencePos.parent;
  const sentenceIndexInBlock = $sentencePos.index();

  // For Case 2 (first sentence in block), check that a previous paragraph exists.
  // This check is surfaced before dispatch so probes also return false correctly.
  if (sentenceIndexInBlock === 0) {
    if (paragraphPos === 0) return false;
    const $paragraphPosCheck = state.doc.resolve(paragraphPos);
    if ($paragraphPosCheck.index() === 0) return false;
  }

  if (dispatch) {
    const tr = state.tr;

    // Case 1: merge with previous sentence in the same block.
    if (sentenceIndexInBlock > 0) {
      const prevSentenceNode = parentBlock.child(sentenceIndexInBlock - 1);
      const prevSentencePos = sentencePos - prevSentenceNode.nodeSize;

      const mergedStartTime = prevSentenceNode.attrs.startInSec ?? 0;
      const mergedEndTime = sentenceNode.attrs.endInSec ?? 0;

      if (!validateTimestampPair(mergedStartTime, mergedEndTime)) {
        // invalid timestamps — claim the key, no-op (do not let baseKeymap merge unchecked)
        return true;
      }

      const prevTextNodes = splitTextNodesWithMarks(
        prevSentenceNode,
        0,
        prevSentenceNode.textContent.length,
        schema,
      );
      const currentTextNodes = splitTextNodesWithMarks(
        sentenceNode,
        0,
        sentenceNode.textContent.length,
        schema,
      );

      const mergedSentenceNode = schema.node(
        "sentence",
        { ...prevSentenceNode.attrs, endInSec: mergedEndTime > 0 ? mergedEndTime : prevSentenceNode.attrs.endInSec },
        [...prevTextNodes, ...currentTextNodes],
      );

      const replaceStart = prevSentencePos;
      const replaceEnd = sentencePos + sentenceNode.nodeSize;

      if (replaceStart < 0 || replaceEnd > tr.doc.content.size) {
        console.error("[Backspace] Case 1: position out of bounds", { replaceStart, replaceEnd });
        return false;
      }

      try {
        tr.replaceWith(replaceStart, replaceEnd, mergedSentenceNode);
        // Cursor at junction: start of merged sentence + prev text length.
        const cursorPos = prevSentencePos + prevSentenceNode.textContent.length + 1;
        const clampedCursor = Math.min(cursorPos, tr.doc.content.size);
        tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, clampedCursor))));
        dispatch(tr.scrollIntoView());
      } catch (e) {
        console.error("[Backspace] Case 1 dispatch error", e);
      }

      return true;
    }

    // Case 2: first sentence in block — merge into previous paragraph.
    // (Pre-dispatch guard already verified paragraphPos > 0 and paragraphIndexInDoc > 0.)
    const $paragraphPos = state.doc.resolve(paragraphPos);
    const docNode = $paragraphPos.parent;
    const paragraphIndexInDoc = $paragraphPos.index();

    const prevParagraphNode = docNode.child(paragraphIndexInDoc - 1);
    const prevParagraphPos = paragraphPos - prevParagraphNode.nodeSize;

    // Get the last block and last sentence of the previous paragraph.
    const prevBlock = prevParagraphNode.child(prevParagraphNode.childCount - 1);
    const lastSentenceInPrevBlock = prevBlock.child(prevBlock.childCount - 1);

    const mergedStartTime = lastSentenceInPrevBlock.attrs.startInSec ?? 0;
    const mergedEndTime = sentenceNode.attrs.endInSec ?? 0;

    if (!validateTimestampPair(mergedStartTime, mergedEndTime)) {
      // invalid timestamps — claim the key, no-op (do not let baseKeymap merge unchecked)
      return true;
    }

    const prevTextNodes = splitTextNodesWithMarks(
      lastSentenceInPrevBlock,
      0,
      lastSentenceInPrevBlock.textContent.length,
      schema,
    );
    const currentTextNodes = splitTextNodesWithMarks(
      sentenceNode,
      0,
      sentenceNode.textContent.length,
      schema,
    );

    const mergedSentenceNode = schema.node(
      "sentence",
      { ...lastSentenceInPrevBlock.attrs, endInSec: mergedEndTime },
      [...prevTextNodes, ...currentTextNodes],
    );

    // Rebuild the previous block: [its sentences except last] + merged + current block's
    // remaining sentences (sentences after the first in the current block).
    const newBlockSentences: import("prosemirror-model").Node[] = [];
    for (let i = 0; i < prevBlock.childCount - 1; i++) {
      newBlockSentences.push(prevBlock.child(i));
    }
    newBlockSentences.push(mergedSentenceNode);
    for (let i = 1; i < parentBlock.childCount; i++) {
      newBlockSentences.push(parentBlock.child(i));
    }

    const newBlock = schema.node("transcript_block", prevBlock.attrs, newBlockSentences);

    // Angular :797-799 — the rebuilt previous paragraph_container collapses to a single block
    // (discards all prev-paragraph blocks except the last, which becomes the merged block).
    const newParagraph = schema.node("paragraph_container", prevParagraphNode.attrs, [newBlock]);

    const replaceStart = prevParagraphPos;
    const replaceEnd = paragraphPos + paragraphNode.nodeSize;

    if (replaceStart < 0 || replaceEnd > tr.doc.content.size) {
      console.error("[Backspace] Case 2: position out of bounds", { replaceStart, replaceEnd });
      return false;
    }

    // Recompute timing attrs on the merged block and paragraph.
    const mergedBlockStart = typeof newBlock.attrs.startInSec === "number"
      ? newBlock.attrs.startInSec
      : parseFloat(newBlock.attrs.startInSec || "0");
    const mergedBlockEnd = mergedEndTime;

    const mergedParagraphStart = mergedBlockStart;
    const mergedParagraphEnd = mergedBlockEnd;

    const finalBlock = schema.node("transcript_block", {
      ...newBlock.attrs,
      startInSec: mergedBlockStart,
      endInSec: mergedBlockEnd,
    }, newBlockSentences);

    const finalParagraph = schema.node("paragraph_container", {
      ...prevParagraphNode.attrs,
      start: mergedParagraphStart,
      end: mergedParagraphEnd,
    }, [finalBlock]);

    try {
      tr.replaceWith(replaceStart, replaceEnd, finalParagraph);

      // Cursor at merge junction: prevParagraphPos + 1(para) + 1(block) + prev sentences
      // + 1(merged sentence open) + prev text length.
      const prevSentencesSize = newBlockSentences
        .slice(0, newBlockSentences.length - 1)
        .reduce((sum, s) => sum + s.nodeSize, 0);
      const cursorPos =
        prevParagraphPos +
        1 + // paragraph_container open
        1 + // transcript_block open
        prevSentencesSize +
        1 + // merged sentence open
        lastSentenceInPrevBlock.textContent.length;

      const clampedCursor = Math.min(cursorPos, tr.doc.content.size);
      tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, clampedCursor))));
      dispatch(tr.scrollIntoView());
    } catch (e) {
      console.error("[Backspace] Case 2 dispatch error", e);
    }
  }

  return true;
}

/**
 * Handle Enter — splits sentence at cursor, creating a new paragraph_container.
 *
 * Port of Angular handleEnterKey (transcript-editor.service.ts:1386-1678).
 * The split creates a real new paragraph_container so extractSegmentsFromDoc emits
 * two segments — fixing the save round-trip data loss.
 *
 * view.editable is checked at the call site in handleKeyDown.
 */
export function handleEnterKey(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection, schema } = state;

  // Guard 1: require collapsed selection.
  if (!selection.empty) return false;

  const { $from } = selection;

  // Find sentence and paragraph_container ancestors.
  let sentenceNode: import("prosemirror-model").Node | null = null;
  let sentencePos: number | null = null;
  let blockNode: import("prosemirror-model").Node | null = null;
  let blockPos: number | null = null;
  let paragraphContainer: import("prosemirror-model").Node | null = null;
  let paragraphPos: number | null = null;

  for (let depth = $from.depth; depth > 0; depth--) {
    const node = $from.node(depth);
    if (node.type.name === "sentence" && !sentenceNode) {
      sentenceNode = node;
      sentencePos = $from.before(depth);
    } else if (node.type.name === "transcript_block" && !blockNode) {
      blockNode = node;
      blockPos = $from.before(depth);
    } else if (node.type.name === "paragraph_container" && !paragraphContainer) {
      paragraphContainer = node;
      paragraphPos = $from.before(depth);
    }
  }

  if (!sentenceNode || sentencePos === null || !blockNode || blockPos === null || !paragraphContainer || paragraphPos === null) {
    return false;
  }

  // Calculate cursor offset within the sentence.
  const sentenceStart = sentencePos + 1; // +1 for the sentence node's opening token
  const relativePos = $from.pos - sentenceStart;
  const totalTextLength = sentenceNode.textContent.length;
  const textBefore = sentenceNode.textContent.substring(0, relativePos);
  const textAfter = sentenceNode.textContent.substring(relativePos);

  // Guard 2: both halves blank → no-op (Angular :1425-1427).
  if (textBefore.trim().length === 0 && textAfter.trim().length === 0) return false;

  const startInSec: number = sentenceNode.attrs.startInSec ?? sentenceNode.attrs.startTime ?? 0;
  const endInSec: number = sentenceNode.attrs.endInSec ?? sentenceNode.attrs.endTime ?? 0;

  // Compute splitTime — branch a (cursor at/past end) must fire BEFORE the word-mark walk.
  let splitTime: number = startInSec;
  let foundWordMark = false;

  if (relativePos >= totalTextLength) {
    // Branch a: cursor at/past last character → 95% cap (early return, skip b–c).
    splitTime = startInSec + 0.95 * (endInSec - startInSec);
  } else {
    // Branch b: walk word marks to find the mark at/before the cursor.
    let charPos = 0;
    sentenceNode.forEach((child) => {
      if (!child.isText) return;
      const childEnd = charPos + child.text!.length;
      if (charPos <= relativePos) {
        for (const mark of child.marks) {
          if (mark.type.name === "word") {
            const mEnd = typeof mark.attrs.endInSec === "number"
              ? mark.attrs.endInSec
              : parseFloat(mark.attrs.endInSec ?? "0") || 0;
            splitTime = mEnd;
            foundWordMark = true;
          }
        }
      }
      charPos = childEnd;
    });

    if (!foundWordMark) {
      // Branch c: proportional fallback (Angular :900-903).
      const safeLen = Math.max(totalTextLength, 1);
      splitTime = startInSec + (relativePos / safeLen) * (endInSec - startInSec);
    }
  }

  // Branch d: final clamp — applies to all paths (Angular :907-910).
  if (splitTime >= endInSec) {
    splitTime = startInSec + 0.90 * (endInSec - startInSec);
  }

  // Guard 3: validate both halves.
  if (
    !validateTimestampPair(startInSec, splitTime) ||
    !validateTimestampPair(splitTime, endInSec) ||
    !(splitTime > startInSec && splitTime < endInSec)
  ) {
    return false;
  }

  if (!dispatch) return true;

  // Partition content with marks preserved and re-timed (W4).
  const textBeforeNodes = splitTextNodesWithMarks(
    sentenceNode,
    0,
    relativePos,
    schema,
    { origStart: startInSec, origEnd: endInSec, newStart: startInSec, newEnd: splitTime },
  );
  const textAfterNodes = splitTextNodesWithMarks(
    sentenceNode,
    relativePos,
    totalTextLength,
    schema,
    { origStart: startInSec, origEnd: endInSec, newStart: splitTime, newEnd: endInSec },
  );

  // Collect remainingSentences before any transaction mutation — positions shift after tr ops.
  const $sentPos = state.doc.resolve(sentencePos);
  const sentenceIndexInBlock = $sentPos.index();
  const remainingSentences: import("prosemirror-model").Node[] = [];
  for (let i = sentenceIndexInBlock + 1; i < blockNode.childCount; i++) {
    remainingSentences.push(blockNode.child(i));
  }

  const tr = state.tr;

  // Re-anchor sentence timing from actual word-mark boundaries when marks exist,
  // falling back to the literal splitTime boundary.
  const computeSentenceTiming = (
    nodes: import("prosemirror-model").Node[],
    fallbackStart: number,
    fallbackEnd: number
  ): { startInSec: number; endInSec: number } => {
    let minStart = Number.POSITIVE_INFINITY;
    let maxEnd = Number.NEGATIVE_INFINITY;
    for (const n of nodes) {
      for (const mark of n.marks) {
        if (mark.type.name === "word") {
          const ms = typeof mark.attrs.startInSec === "number" ? mark.attrs.startInSec : parseFloat(mark.attrs.startInSec ?? "0") || 0;
          const me = typeof mark.attrs.endInSec === "number" ? mark.attrs.endInSec : parseFloat(mark.attrs.endInSec ?? "0") || ms;
          if (ms < minStart) minStart = ms;
          if (me > maxEnd) maxEnd = me;
        }
      }
    }
    return {
      startInSec: minStart !== Number.POSITIVE_INFINITY ? minStart : fallbackStart,
      endInSec: maxEnd !== Number.NEGATIVE_INFINITY ? maxEnd : fallbackEnd,
    };
  };

  const beforeTiming = computeSentenceTiming(textBeforeNodes, startInSec, splitTime);
  const afterTiming = computeSentenceTiming(textAfterNodes, splitTime, endInSec);

  // Build the updated current sentence (textBefore, endInSec = splitTime).
  const updatedCurrentSentence = schema.node(
    "sentence",
    {
      ...sentenceNode.attrs,
      startInSec: beforeTiming.startInSec,
      endInSec: beforeTiming.endInSec,
    },
    textBeforeNodes,
  );

  // Replace current sentence in the transaction.
  const sentenceEnd = sentencePos + sentenceNode.nodeSize;
  if (sentencePos < 0 || sentenceEnd > tr.doc.content.size) {
    console.error("[Enter] sentence position out of bounds");
    return false;
  }
  tr.replaceWith(sentencePos, sentenceEnd, updatedCurrentSentence);

  // Remove remainingSentences from the current block (after updating current sentence).
  if (remainingSentences.length > 0) {
    // Re-resolve block position after the sentence replacement.
    const mappedBlockPos = tr.mapping.map(blockPos);
    const updatedBlock = tr.doc.nodeAt(mappedBlockPos);
    if (!updatedBlock) {
      console.error("[Enter] Could not find updated block");
      return false;
    }

    // Find end of updated current sentence in the block.
    let removeStart = mappedBlockPos + 1;
    for (let i = 0; i <= sentenceIndexInBlock; i++) {
      removeStart += updatedBlock.child(i).nodeSize;
    }
    const removeEnd = mappedBlockPos + updatedBlock.nodeSize - 1;

    if (removeStart < removeEnd) {
      tr.delete(removeStart, removeEnd);
    }
  }

  // Recompute timing for the current block (level ii).
  const mappedBlockPos2 = tr.mapping.map(blockPos);
  const currentBlockNode = tr.doc.nodeAt(mappedBlockPos2);
  let currentBlockStart = startInSec;
  let currentBlockEnd = beforeTiming.endInSec;
  if (currentBlockNode) {
    let minBS = Number.POSITIVE_INFINITY;
    let maxBE = Number.NEGATIVE_INFINITY;
    currentBlockNode.forEach((s) => {
      const ss = typeof s.attrs.startInSec === "number" ? s.attrs.startInSec : parseFloat(s.attrs.startInSec || "0");
      const se = typeof s.attrs.endInSec === "number" ? s.attrs.endInSec : parseFloat(s.attrs.endInSec || "0");
      if (ss < minBS) minBS = ss;
      if (se > maxBE) maxBE = se;
    });
    if (minBS !== Number.POSITIVE_INFINITY) currentBlockStart = minBS;
    if (maxBE !== Number.NEGATIVE_INFINITY) currentBlockEnd = maxBE;
    tr.setNodeMarkup(mappedBlockPos2, undefined, {
      ...currentBlockNode.attrs,
      startInSec: currentBlockStart,
      endInSec: currentBlockEnd,
    });
  }

  // Recompute timing for the current paragraph_container (level iii).
  const mappedParaPos = tr.mapping.map(paragraphPos);
  const currentParaNode = tr.doc.nodeAt(mappedParaPos);
  if (currentParaNode && currentParaNode.type.name === "paragraph_container") {
    let minPS = Number.POSITIVE_INFINITY;
    let maxPE = Number.NEGATIVE_INFINITY;
    currentParaNode.forEach((blk) => {
      const bs = typeof blk.attrs.startInSec === "number" ? blk.attrs.startInSec : parseFloat(blk.attrs.startInSec || "0");
      const be = typeof blk.attrs.endInSec === "number" ? blk.attrs.endInSec : parseFloat(blk.attrs.endInSec || "0");
      if (bs < minPS) minPS = bs;
      if (be > maxPE) maxPE = be;
    });
    tr.setNodeMarkup(mappedParaPos, undefined, {
      ...currentParaNode.attrs,
      start: minPS !== Number.POSITIVE_INFINITY ? minPS : startInSec,
      end: maxPE !== Number.NEGATIVE_INFINITY ? maxPE : currentBlockEnd,
    });
  }

  // speakerId via Angular's 4-way fallback (Angular :1598-1603).
  const speakerId: string =
    blockNode.attrs.speakerId ||
    paragraphContainer.attrs.speakerId ||
    sentenceNode.attrs.speakerId ||
    blockNode.attrs.speaker?.userId ||
    "";

  // Speaker object copied from the block attrs (Angular :1597).
  const preservedSpeaker = blockNode.attrs.speaker
    ? { ...blockNode.attrs.speaker }
    : {
        speakerImg: "",
        name: speakerId ? `Speaker ${speakerId}` : "",
        userId: speakerId || "",
      };

  // Fresh IDs for new paragraph/block/sentence.
  const newSentenceId = String(Date.now()) + "_s";
  const newParagraphId = String(Date.now()) + "_p";
  const newBlockId = String(Date.now()) + "_b";

  // Build the new sentence (textAfter + remainingSentences in the new block).
  const newSentence = schema.node(
    "sentence",
    {
      sentenceId: newSentenceId,
      speakerId: speakerId,
      startInSec: afterTiming.startInSec,
      endInSec: afterTiming.endInSec,
    },
    textAfterNodes,
  );

  const newBlock = schema.node(
    "transcript_block",
    {
      paragraphId: newParagraphId,
      sentenceId: newBlockId,
      speakerId: speakerId,
      speaker: preservedSpeaker,
      isParagraphStart: true,
      startInSec: afterTiming.startInSec,
      endInSec: afterTiming.endInSec,
    },
    [newSentence, ...remainingSentences],
  );

  // Recompute new block timing from its sentences (level ii for new block).
  let newBlockStart = afterTiming.startInSec;
  let newBlockEnd = afterTiming.endInSec;
  {
    let minBS = Number.POSITIVE_INFINITY;
    let maxBE = Number.NEGATIVE_INFINITY;
    newBlock.forEach((s) => {
      const ss = typeof s.attrs.startInSec === "number" ? s.attrs.startInSec : parseFloat(s.attrs.startInSec || "0");
      const se = typeof s.attrs.endInSec === "number" ? s.attrs.endInSec : parseFloat(s.attrs.endInSec || "0");
      if (ss < minBS) minBS = ss;
      if (se > maxBE) maxBE = se;
    });
    if (minBS !== Number.POSITIVE_INFINITY) newBlockStart = minBS;
    if (maxBE !== Number.NEGATIVE_INFINITY) newBlockEnd = maxBE;
  }

  const finalNewBlock = schema.node(
    "transcript_block",
    {
      ...newBlock.attrs,
      startInSec: newBlockStart,
      endInSec: newBlockEnd,
    },
    newBlock.content,
  );

  const newParagraph = schema.node(
    "paragraph_container",
    {
      speakerId: speakerId,
      speaker: preservedSpeaker,
      paragraphId: newParagraphId,
      start: newBlockStart,
      end: newBlockEnd,
    },
    [finalNewBlock],
  );

  // Insert new paragraph immediately after the current one.
  const finalMappedParaPos = tr.mapping.map(paragraphPos);
  const finalCurrentPara = tr.doc.nodeAt(finalMappedParaPos);
  if (!finalCurrentPara) {
    console.error("[Enter] Could not find final current paragraph");
    return false;
  }
  const insertPos = finalMappedParaPos + finalCurrentPara.nodeSize;

  if (insertPos < 0 || insertPos > tr.doc.content.size) {
    console.error("[Enter] insertPos out of bounds", insertPos);
    return false;
  }

  tr.insert(insertPos, newParagraph);

  // Cursor at start of the new sentence (inside new paragraph > block > sentence).
  const newParaInsertedPos = tr.mapping.map(insertPos);
  // newParagraph + 1(para open) + 1(block open) + 1(sentence open) = inside sentence
  const newCursorPos = newParaInsertedPos + 1 + 1 + 1;
  const clampedCursor = Math.min(newCursorPos, tr.doc.content.size - 1);

  try {
    tr.setSelection(TextSelection.near(tr.doc.resolve(Math.max(0, clampedCursor))));
  } catch {
    // Fallback to end of document on stale position.
  }

  dispatch(tr.scrollIntoView());
  return true;
}

/** Jump cursor to the start of the next sentence. */
function jumpToNextSentenceCommand(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection, schema, doc } = state;
  const sentenceType = schema.nodes["sentence"];
  if (!sentenceType) return false;

  const { $from } = selection;

  // Find current sentence
  let sentenceDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type === sentenceType) {
      sentenceDepth = d;
      break;
    }
  }
  if (sentenceDepth === -1) return false;

  const currentSentenceEnd = $from.after(sentenceDepth);

  // Find next sentence by walking the doc from currentSentenceEnd
  let nextSentencePos: number | null = null;
  doc.nodesBetween(currentSentenceEnd, doc.content.size, (node, pos) => {
    if (nextSentencePos !== null) return false;
    if (node.type === sentenceType) {
      nextSentencePos = pos + 1;
      return false;
    }
    return true;
  });

  if (nextSentencePos === null) return false;
  if (!dispatch) return true;

  const tr = state.tr.setSelection(
    TextSelection.near(state.tr.doc.resolve(nextSentencePos))
  );
  dispatch(tr.scrollIntoView());
  return true;
}

// ── Plugin ────────────────────────────────────────────────────────

export function createEditCommandsPlugin() {
  return new Plugin({
    props: {
      handleKeyDown(view: EditorView, event: KeyboardEvent) {
        if (!view.editable) return false;

        const { state, dispatch } = view;

        // Mod-j → merge paragraphs
        if (isMod(event) && !event.shiftKey && event.key === "j") {
          event.preventDefault();
          return mergeParagraphsCommand(state, dispatch);
        }

        // Mod-Shift-d → duplicate paragraph
        if (isMod(event) && event.shiftKey && event.key.toLowerCase() === "d") {
          event.preventDefault();
          return duplicateParagraphCommand(state, dispatch);
        }

        // Backspace → custom sentence/paragraph merge (crosses the isolating block)
        if (!isMod(event) && !event.shiftKey && event.key === "Backspace") {
          return handleBackspaceKey(state, dispatch);
        }

        // Enter → split sentence
        if (!isMod(event) && !event.shiftKey && event.key === "Enter") {
          return handleEnterKey(state, dispatch);
        }

        // Tab → jump to next sentence
        if (!isMod(event) && !event.shiftKey && event.key === "Tab") {
          event.preventDefault();
          return jumpToNextSentenceCommand(state, dispatch);
        }

        return false;
      },
    },
  });
}
