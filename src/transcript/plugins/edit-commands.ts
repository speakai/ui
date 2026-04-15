/**
 * ProseMirror plugin for transcript-specific editing commands.
 *
 * Commands:
 * - Mod-j          → merge current paragraph_container with previous (same speaker)
 * - Mod-Shift-d    → duplicate current paragraph_container, place after, move cursor
 * - Enter          → split sentence at cursor
 * - Tab            → jump cursor to next sentence
 *
 * Schema hierarchy: doc > paragraph_container > transcript_block > sentence > text*
 */

import { Plugin, TextSelection } from "prosemirror-state";
import type { EditorState, Transaction } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

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

/** Merge current paragraph_container into the previous one if same speakerId. */
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

  // Only merge if same speaker
  if (prevNode.attrs.speakerId !== current.node.attrs.speakerId) return false;

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

/** Split the current sentence at the cursor position. */
function handleEnterKey(
  state: EditorState,
  dispatch?: (tr: Transaction) => void
): boolean {
  const { selection, schema } = state;
  if (!selection.empty) return false;

  const sentenceType = schema.nodes["sentence"];
  if (!sentenceType) return false;

  const { $from } = selection;

  // Find the sentence ancestor
  let sentenceDepth = -1;
  for (let d = $from.depth; d >= 0; d--) {
    if ($from.node(d).type === sentenceType) {
      sentenceDepth = d;
      break;
    }
  }
  if (sentenceDepth === -1) return false;
  if (!dispatch) return true;

  const sentenceNode = $from.node(sentenceDepth);
  const sentenceStart = $from.start(sentenceDepth);
  const cursorOffset = $from.pos - sentenceStart;

  // Split text into before/after cursor
  let textBefore = "";
  let textAfter = "";
  let accumulated = 0;
  sentenceNode.forEach((child) => {
    if (child.isText && child.text) {
      const start = accumulated;
      const end = accumulated + child.text.length;
      if (end <= cursorOffset) {
        textBefore += child.text;
      } else if (start >= cursorOffset) {
        textAfter += child.text;
      } else {
        textBefore += child.text.slice(0, cursorOffset - start);
        textAfter += child.text.slice(cursorOffset - start);
      }
      accumulated += child.text.length;
    }
  });

  const beforeContent = textBefore
    ? schema.text(textBefore)
    : null;
  const afterContent = textAfter
    ? schema.text(textAfter)
    : null;

  const newSentenceBefore = sentenceType.create(
    sentenceNode.attrs,
    beforeContent ? [beforeContent] : []
  );
  const newSentenceAfter = sentenceType.create(
    { ...sentenceNode.attrs, sentenceId: "" },
    afterContent ? [afterContent] : []
  );

  const sentenceNodeStart = $from.before(sentenceDepth);
  const sentenceNodeEnd = $from.after(sentenceDepth);

  const tr = state.tr.replaceWith(
    sentenceNodeStart,
    sentenceNodeEnd,
    [newSentenceBefore, newSentenceAfter]
  );

  // Place cursor at start of the new second sentence
  const newCursorPos = sentenceNodeStart + newSentenceBefore.nodeSize + 1;
  tr.setSelection(
    TextSelection.near(tr.doc.resolve(Math.min(newCursorPos, tr.doc.content.size - 1)))
  );

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
