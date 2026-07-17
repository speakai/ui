/**
 * Responsive category (x-axis) tick rendering for bar charts.
 *
 * The naive approach — always angle labels -45° and hard-truncate at a fixed
 * length — wastes horizontal room when a chart has only a few wide bars (e.g.
 * "Call score by account" with 4 accounts) and clips names that would
 * otherwise fit. `computeCategoryAxis` picks a layout from the bar count and
 * container width: flat, word-wrapped labels when each bar has room, angled
 * single-line truncation when bars are packed tight (or on mobile).
 */

export interface CategoryAxisLayout {
  angle: number;
  textAnchor: "middle" | "end";
  /** Reserved x-axis height (px) — enough for the chosen angle + line count. */
  height: number;
  /** recharts `interval` — how many ticks to skip between rendered labels. */
  interval: number;
  maxCharsPerLine: number;
  maxLines: number;
}

/** Approx px width of one character at the axis font size (12px Inter). */
const CHAR_PX = 7;
/** Below this per-bar width, flat labels collide — angle them instead. */
const FLAT_MIN_PER_BAR_PX = 88;

/**
 * Choose an x-axis label layout for `count` categories in `containerWidth` px.
 * `charCap` (e.g. a caller's `tickMaxLength`) upper-bounds the per-line length
 * so existing callers keep their tighter truncation. `allowFlat=false` forces
 * the angled single-line layout regardless of room — used for line/area
 * time-series axes, where wrapping date labels reads worse than a slight tilt.
 */
export function computeCategoryAxis(
  count: number,
  containerWidth: number,
  isMobile: boolean,
  charCap?: number,
  allowFlat = true,
): CategoryAxisLayout {
  const perBar = count > 0 ? containerWidth / count : containerWidth;
  const flat = allowFlat && !isMobile && perBar >= FLAT_MIN_PER_BAR_PX;

  if (flat) {
    const roomChars = Math.max(6, Math.floor((perBar - 8) / CHAR_PX));
    return {
      angle: 0,
      textAnchor: "middle",
      height: 52, // room for the 8px tickMargin gap + up to 2 wrapped lines
      interval: 0,
      maxCharsPerLine: charCap ? Math.min(charCap, roomChars) : roomChars,
      maxLines: 2,
    };
  }

  return {
    angle: -45,
    textAnchor: "end",
    height: isMobile ? 50 : 80,
    interval: isMobile ? Math.max(1, Math.ceil(count / 6) - 1) : 0,
    maxCharsPerLine: charCap ?? 16,
    maxLines: 1,
  };
}

/**
 * Greedy word-wrap `text` into at most `maxLines` lines of at most `maxChars`
 * characters. The final line ellipsis-truncates any remaining overflow. A
 * single word longer than `maxChars` is hard-truncated.
 */
export function wrapLabel(text: string, maxChars: number, maxLines: number): string[] {
  const clean = (text ?? "").trim();
  if (!clean) return [""];

  const truncate = (s: string) =>
    s.length > maxChars ? s.slice(0, Math.max(1, maxChars - 1)) + "…" : s;

  if (maxLines <= 1) return [truncate(clean)];

  const words = clean.split(/\s+/);
  const lines: string[] = [];
  let cur = "";

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const candidate = cur ? `${cur} ${word}` : word;

    if (candidate.length <= maxChars) {
      cur = candidate;
      continue;
    }

    // `candidate` overflows the current line. Truncate on flush so a single
    // token longer than `maxChars` (an account slug, email, long field value)
    // is still capped — `truncate` is a no-op on lines that already fit.
    if (cur) lines.push(truncate(cur));

    if (lines.length === maxLines - 1) {
      // Last allowed line: pack the remaining words, then ellipsis-truncate.
      lines.push(truncate(words.slice(i).join(" ")));
      return lines;
    }
    cur = word;
  }

  if (cur) lines.push(truncate(cur));
  return lines.slice(0, maxLines);
}

// ── Custom recharts tick ──────────────────────────────────────────────────────

interface CategoryAxisTickProps {
  // recharts injects these:
  x?: number;
  y?: number;
  payload?: { value?: string };
  // caller-supplied:
  angle: number;
  textAnchor: "middle" | "end";
  maxCharsPerLine: number;
  maxLines: number;
  fill: string;
  fontSize: number;
}

/**
 * SVG tick that renders a category label as up to `maxLines` wrapped tspans
 * (flat) or a single rotated line (angled). Pass as `<XAxis tick={<... />} />`;
 * recharts merges `x`/`y`/`payload` onto the element.
 */
export function CategoryAxisTick({
  x = 0,
  y = 0,
  payload,
  angle,
  textAnchor,
  maxCharsPerLine,
  maxLines,
  fill,
  fontSize,
}: CategoryAxisTickProps) {
  const lines = wrapLabel(payload?.value ?? "", maxCharsPerLine, angle ? 1 : maxLines);
  const lineHeight = fontSize + 2;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        className="recharts-cartesian-axis-tick-value"
        transform={angle ? `rotate(${angle})` : undefined}
        textAnchor={textAnchor}
        fill={fill}
        fontSize={fontSize}
        dy={angle ? 4 : fontSize}
      >
        {lines.map((line, i) => (
          <tspan key={i} x={0} dy={i === 0 ? 0 : lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}
