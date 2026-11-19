/**
 * Text shown when FileDropzone or ImageUploader refuses files. Pass your own
 * functions to translate it; any you leave out keep the built-in English.
 */
export interface FileRejectionLabels {
  /** Files that do not match `accept`. */
  invalidType?: (count: number) => string;
  /** Files over `maxSize`. `limit` is already formatted, e.g. "2.0 MB". */
  tooLarge?: (count: number, limit: string) => string;
}

/** Formats a byte limit the way the rejection text shows it, e.g. "2.0 MB". */
export function formatSizeLimit(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
