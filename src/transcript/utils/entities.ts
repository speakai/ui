/**
 * Utility to extract ITranscriptSegment[] from a ProseMirror document.
 *
 * Used when saving edited transcripts — converts the ProseMirror doc
 * back into the API's segment format.
 */

import type { Node as PMNode } from "prosemirror-model";
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
