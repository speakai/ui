import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Badge } from "../Badge";
import { Skeleton } from "../Skeleton";
import { formatClockDuration } from "./format";
import { ChevronLeftIcon, ChevronRightIcon, FileAudioIcon, PlayIcon } from "./icons";

const POSTER_SEEK_SECONDS = 3;
const POSTER_ROOT_MARGIN = "200px";
const CARD_GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const SKELETON_CARD_COUNT = 3;

export interface SessionCardConfig {
  titleColumn?: string;
  subtitleColumns?: string[];
  detailColumns?: string[];
  showDuration?: boolean;
  /** "rows" renders one snap-scroll row per `rowBy` value; "grid" (default) is a plain grid. */
  layout?: "grid" | "rows";
  /** Column header whose cell text names each row. Needed for the "rows" layout. */
  rowBy?: string;
  /** Row values shown first, in this order; the rest follow by count. */
  rowOrder?: string[];
  /** Render the first record as a wide hero banner above the grid or rows. */
  hero?: boolean;
}

export interface SessionCardLabels {
  /** Hero call-to-action. Defaults to "Play". */
  play?: string;
  /** Row scroll button labels. Default "Scroll left" and "Scroll right". */
  scrollPrevious?: string;
  scrollNext?: string;
  /** Title of the row holding cards with no row value. Defaults to "Other". */
  otherRow?: string;
  /** Count shown beside a row title. Defaults to the bare number. */
  rowCount?: (count: number) => string;
  audioOnly?: string;
}

export interface SessionCardData {
  /** Row value for the "rows" layout. */
  group?: string;
  key: string;
  mediaId?: string;
  mediaType?: "video" | "audio";
  mediaUrl?: string;
  durationSec?: number;
  title: string;
  subtitles: string[];
  details: string[];
}

function useNearViewport() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: POSTER_ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [near]);

  return { ref, near };
}

interface SessionPosterProps {
  card: SessionCardData;
  showDuration: boolean;
  clickable: boolean;
  audioOnlyLabel?: string;
  /** Replaces the default card-top sizing and rounding. */
  className?: string;
  /** Hides the centered play glyph when a separate control carries the call to action. */
  hidePlayGlyph?: boolean;
}

function SessionPoster({
  card,
  showDuration,
  clickable,
  audioOnlyLabel,
  className,
  hidePlayGlyph,
}: SessionPosterProps) {
  const { ref, near } = useNearViewport();
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { mediaUrl, durationSec } = card;
  const isAudio = card.mediaType === "audio";
  const isVideo = !isAudio && !!mediaUrl;
  const showVideo = near && isVideo && !failed;
  const showPlayButton = clickable && isVideo && !hidePlayGlyph;

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden bg-muted", className ?? "aspect-video rounded-t-xl")}
    >
      {showVideo ? (
        <video
          src={`${mediaUrl}#t=${POSTER_SEEK_SECONDS}`}
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          aria-hidden="true"
          onLoadedData={() => setFrameReady(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            frameReady ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {!frameReady || failed ? (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {isAudio ? (
            <span className="flex flex-col items-center gap-1 text-xs font-medium">
              <FileAudioIcon className="h-8 w-8" />
              {audioOnlyLabel ?? "Audio"}
            </span>
          ) : showPlayButton || hidePlayGlyph ? null : (
            <PlayIcon className="h-8 w-8 opacity-60" />
          )}
        </div>
      ) : null}
      {showPlayButton ? (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="rounded-full bg-black/70 p-3 text-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-110">
            <PlayIcon className="ml-0.5 h-6 w-6 fill-current" />
          </span>
        </div>
      ) : null}
      {showDuration && typeof durationSec === "number" && durationSec > 0 ? (
        <span className="absolute bottom-2 end-2 rounded-md bg-black/70 px-1.5 py-0.5 text-xs font-medium tabular-nums text-white backdrop-blur-sm">
          {formatClockDuration(durationSec)}
        </span>
      ) : null}
    </div>
  );
}

interface SessionCardProps {
  card: SessionCardData;
  showDuration: boolean;
  clickable: boolean;
  audioOnlyLabel?: string;
  onOpen?: (mediaId: string) => void;
}

function SessionCard({ card, showDuration, clickable, audioOnlyLabel, onOpen }: SessionCardProps) {
  const mediaId = clickable ? card.mediaId : undefined;
  const [topic, ...subtitles] = card.subtitles;
  return (
    <article
      className={cn(
        "group relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        mediaId && "transition-shadow hover:shadow-md",
      )}
    >
      <SessionPoster
        card={card}
        showDuration={showDuration}
        clickable={!!mediaId}
        audioOnlyLabel={audioOnlyLabel}
      />
      <div className="flex flex-1 flex-col gap-1 p-3 text-start">
        {topic ? (
          <Badge color="gray" size="sm" role={undefined} className="mb-1 max-w-full self-start rounded-md">
            <span className="line-clamp-1">{topic}</span>
          </Badge>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{card.title}</h3>
        {subtitles.map((line, i) => (
          <p key={`s-${i}`} className="line-clamp-1 text-sm text-muted-foreground">
            {line}
          </p>
        ))}
        {card.details.map((line, i) => (
          <p key={`d-${i}`} className="line-clamp-3 text-xs text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
      {mediaId ? (
        <button
          type="button"
          aria-label={card.title}
          onClick={() => onOpen?.(mediaId)}
          className="absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      ) : null}
    </article>
  );
}

export interface SessionCardRow {
  key: string;
  title: string;
  cards: SessionCardData[];
}

const OTHER_ROW_KEY = "\u0000other";

/** Splits cards into rows by `group`: `order` values first, then by count (ties keep first appearance), blanks last. */
export function groupSessionCards(
  cards: SessionCardData[],
  order: string[] = [],
  otherTitle = "Other",
): SessionCardRow[] {
  const byValue = new Map<string, SessionCardData[]>();
  const blanks: SessionCardData[] = [];
  for (const card of cards) {
    const value = card.group?.trim();
    if (!value) {
      blanks.push(card);
      continue;
    }
    const list = byValue.get(value);
    if (list) list.push(card);
    else byValue.set(value, [card]);
  }

  const rows: SessionCardRow[] = [];
  const placed = new Set<string>();
  for (const raw of order) {
    const value = raw.trim();
    const list = byValue.get(value);
    if (!list || placed.has(value)) continue;
    placed.add(value);
    rows.push({ key: value, title: value, cards: list });
  }
  const rest = [...byValue.entries()]
    .filter(([value]) => !placed.has(value))
    .map(([value, list], index) => ({ value, list, index }))
    .sort((a, b) => b.list.length - a.list.length || a.index - b.index);
  for (const { value, list } of rest) rows.push({ key: value, title: value, cards: list });
  if (blanks.length > 0) rows.push({ key: OTHER_ROW_KEY, title: otherTitle, cards: blanks });
  return rows;
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const ROW_CARD_CLASS =
  "w-[85%] shrink-0 snap-start sm:w-[calc((100%-1rem)/2.3)] lg:w-[calc((100%-3rem)/3.4)]";
const ROW_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

interface SessionCardRowViewProps {
  row: SessionCardRow;
  showDuration: boolean;
  clickable: boolean;
  labels?: SessionCardLabels;
  onOpen?: (mediaId: string) => void;
}

function SessionCardRowView({ row, showDuration, clickable, labels, onOpen }: SessionCardRowViewProps) {
  const titleId = useId();
  const scroller = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measure = useCallback(() => {
    const node = scroller.current;
    if (!node) return;
    // Scroll offsets go negative in right-to-left layouts, so compare magnitudes.
    const offset = Math.abs(node.scrollLeft);
    setCanPrev(offset > 1);
    setCanNext(offset + node.clientWidth < node.scrollWidth - 1);
  }, []);

  useEffect(() => {
    measure();
    const node = scroller.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [measure, row.cards.length]);

  const scrollByPage = (direction: 1 | -1) => {
    const node = scroller.current;
    if (!node) return;
    const rtl = getComputedStyle(node).direction === "rtl";
    node.scrollBy({
      left: direction * (rtl ? -1 : 1) * node.clientWidth * 0.9,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  };

  const count = labels?.rowCount ? labels.rowCount(row.cards.length) : String(row.cards.length);
  return (
    <section aria-labelledby={titleId} className="flex min-w-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <h3 id={titleId} className="flex min-w-0 items-baseline gap-2 text-base font-semibold text-foreground">
          <span className="truncate">{row.title}</span>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">{count}</span>
        </h3>
        <div className="hidden shrink-0 gap-1.5 md:flex">
          <button
            type="button"
            aria-label={`${labels?.scrollPrevious ?? "Scroll left"}: ${row.title}`}
            disabled={!canPrev}
            onClick={() => scrollByPage(-1)}
            className={ROW_BUTTON_CLASS}
          >
            <ChevronLeftIcon className="h-4 w-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label={`${labels?.scrollNext ?? "Scroll right"}: ${row.title}`}
            disabled={!canNext}
            onClick={() => scrollByPage(1)}
            className={ROW_BUTTON_CLASS}
          >
            <ChevronRightIcon className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      </div>
      <div
        ref={scroller}
        role="group"
        aria-labelledby={titleId}
        tabIndex={0}
        onScroll={measure}
        data-testid="session-card-row"
        className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-3 [scrollbar-width:thin] motion-reduce:scroll-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
      >
        {row.cards.map((card) => (
          <div key={card.key} className={ROW_CARD_CLASS}>
            <SessionCard
              card={card}
              showDuration={showDuration}
              clickable={clickable}
              audioOnlyLabel={labels?.audioOnly}
              onOpen={onOpen}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

interface SessionHeroProps {
  card: SessionCardData;
  showDuration: boolean;
  clickable: boolean;
  labels?: SessionCardLabels;
  onOpen?: (mediaId: string) => void;
}

function SessionHero({ card, showDuration, clickable, labels, onOpen }: SessionHeroProps) {
  const mediaId = clickable ? card.mediaId : undefined;
  const [kicker, ...subtitles] = card.subtitles;
  const [detail] = card.details;
  return (
    <article
      data-testid="session-card-hero"
      className="group relative isolate overflow-hidden rounded-xl border border-border bg-card text-card-foreground md:bg-black"
    >
      <SessionPoster
        card={card}
        showDuration={showDuration}
        clickable={!!mediaId}
        audioOnlyLabel={labels?.audioOnly}
        hidePlayGlyph
        className="aspect-video md:aspect-[21/9]"
      />
      <div className="flex flex-col gap-2 p-4 text-start md:absolute md:inset-x-0 md:bottom-0 md:bg-gradient-to-t md:from-black/90 md:via-black/60 md:to-transparent md:px-8 md:pb-8 md:pt-20 md:text-white">
        {kicker ? (
          <span className="line-clamp-1 max-w-full self-start rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-foreground md:bg-white/20 md:text-white">
            {kicker}
          </span>
        ) : null}
        <h3 className="line-clamp-2 max-w-2xl text-xl font-bold leading-tight text-foreground md:text-3xl md:text-white">
          {card.title}
        </h3>
        {subtitles.map((line, i) => (
          <p key={`s-${i}`} className="line-clamp-1 text-sm text-muted-foreground md:text-white/80">
            {line}
          </p>
        ))}
        {detail ? (
          <p className="line-clamp-3 max-w-2xl text-sm text-muted-foreground md:line-clamp-2 md:text-white/80">
            {detail}
          </p>
        ) : null}
        {mediaId ? (
          <button
            type="button"
            onClick={() => onOpen?.(mediaId)}
            className="mt-2 inline-flex h-11 min-w-28 cursor-pointer items-center justify-center gap-2 self-start rounded-md bg-foreground px-5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring after:absolute after:inset-0 after:content-[''] md:bg-white md:text-black"
          >
            <PlayIcon className="h-4 w-4 fill-current" />
            <span>{labels?.play ?? "Play"}</span>
            <span className="sr-only">: {card.title}</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}

interface SessionCardGridProps {
  cards: SessionCardData[];
  config?: SessionCardConfig;
  clickable: boolean;
  audioOnlyLabel?: string;
  labels?: SessionCardLabels;
  /** Rendered as a hero banner above the cards; pass it only when `config.hero` is on. */
  hero?: SessionCardData;
  onOpen?: (mediaId: string) => void;
}

export function SessionCardGrid({
  cards,
  config,
  clickable,
  audioOnlyLabel,
  labels,
  hero,
  onOpen,
}: SessionCardGridProps) {
  const showDuration = config?.showDuration !== false;
  const mergedLabels: SessionCardLabels = { ...labels, audioOnly: labels?.audioOnly ?? audioOnlyLabel };
  // Without a resolvable row column the rows layout would be one "Other" row, so fall back to the grid.
  const asRows = config?.layout === "rows" && cards.some((card) => card.group?.trim());
  const rows = asRows ? groupSessionCards(cards, config?.rowOrder, mergedLabels.otherRow) : [];
  return (
    <div className="flex min-w-0 flex-col gap-6">
      {hero ? (
        <SessionHero
          card={hero}
          showDuration={showDuration}
          clickable={clickable}
          labels={mergedLabels}
          onOpen={onOpen}
        />
      ) : null}
      {asRows ? (
        rows.map((row) => (
          <SessionCardRowView
            key={row.key}
            row={row}
            showDuration={showDuration}
            clickable={clickable}
            labels={mergedLabels}
            onOpen={onOpen}
          />
        ))
      ) : cards.length > 0 ? (
        <div className={CARD_GRID_CLASS}>
          {cards.map((card) => (
            <SessionCard
              key={card.key}
              card={card}
              showDuration={showDuration}
              clickable={clickable}
              audioOnlyLabel={mergedLabels.audioOnly}
              onOpen={onOpen}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SessionCardGridSkeleton({ hero }: { hero?: boolean } = {}) {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      {hero ? <Skeleton className="aspect-video w-full rounded-xl md:aspect-[21/9]" /> : null}
      <div className={CARD_GRID_CLASS}>
        {Array.from({ length: SKELETON_CARD_COUNT }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
            <Skeleton className="aspect-video w-full rounded-none" />
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
