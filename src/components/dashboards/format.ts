/**
 * Pure number/duration/size formatting helpers for the dashboard widget bodies.
 *
 * Ported verbatim (behaviour-identical) from the speak-client `lib/utils/format`
 * so the presentational widgets render the same value strings in both the authed
 * builder and the anonymous public view without depending on the app. No i18n,
 * no framework — pure functions only.
 */

const FILE_SIZE_UNITS = ["bytes", "KB", "MB", "GB", "TB", "PB"];

/** Format a byte count as a human-readable file size (e.g. "1.50 MB"). */
export function formatFileSize(bytes: number = 0, precision: number = 2): string {
  if (isNaN(parseFloat(String(bytes))) || !isFinite(bytes)) {
    return "?";
  }

  let unit = 0;
  let size = bytes;

  while (size >= 1024 && unit < FILE_SIZE_UNITS.length - 1) {
    size /= 1024;
    unit++;
  }

  return size.toFixed(precision) + " " + FILE_SIZE_UNITS[unit];
}

function isNumeric(value: number): boolean {
  const abs = Math.abs(value);
  const str = String(abs);
  return /^-{0,1}\d+$/.test(str) || /^\d+\.\d+$/.test(str);
}

/** Format a number with a K/M/B/… suffix (e.g. 1500 → "1.5K"). */
export function formatNumberSuffix(input: number, decimals?: number): string {
  const suffixes = ["K", "M", "B", "T", "P", "E"];
  const isNegativeValue = input < 0;

  if (
    Number.isNaN(input) ||
    (input < 1000 && input >= 0) ||
    !isNumeric(input) ||
    (input < 0 && input > -1000)
  ) {
    if (decimals != null && isNumeric(input) && !(input < 0) && input !== 0) {
      return input.toFixed(decimals);
    } else {
      return String(input);
    }
  }

  const absInput = isNegativeValue ? input * -1 : input;
  const exp = Math.floor(Math.log(absInput) / Math.log(1000));
  const formatted = (absInput / Math.pow(1000, exp)).toFixed(decimals);

  return (isNegativeValue ? "-" : "") + formatted + suffixes[exp - 1];
}

/**
 * Format a count for display: full locale-grouped digits ("1,327"), falling back
 * to compact K/M/B notation only for very large values so a stat card stays
 * readable. Use this for dashboard metric values where "1K" would hide precision.
 */
export function formatCount(input: number): string {
  if (Number.isNaN(input) || !isNumeric(input)) return String(input);
  return Math.abs(input) < 100_000
    ? Math.round(input).toLocaleString("en-US")
    : formatNumberSuffix(input, 1);
}

/** Format aggregate seconds as a human-readable duration (e.g. "1,004h 4m"). */
export function formatDurationHuman(seconds: number | null | undefined): string {
  if (seconds == null || isNaN(seconds) || seconds < 0) return "";
  const s = Math.floor(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(s / 3600);
  const rem = Math.floor((s % 3600) / 60);
  const hStr = h.toLocaleString("en-US");
  return rem > 0 ? `${hStr}h ${rem}m` : `${hStr}h`;
}
