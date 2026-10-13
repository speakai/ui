/** Session cards: the card layout of the records table, with a poster frame loaded lazily from the media itself. */

import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { FileAudioIcon, PlayIcon } from "./icons";

// ── Contract ─────────────────────────────────────────────────────────────────

/** Which table columns feed a card. Every value is a column header. */
export interface SessionCardConfig {
  titleColumn?: string;
  subtitleColumns?: string[];
  detailColumns?: string[];
  /** Show the duration badge on the poster. Defaults to true. */
  showDuration?: boolean;
}

/** Resolves a playable URL for a media id, or null when there is none. */
export type ResolvePosterUrl = (mediaId: string) => Promise<string | null | undefined>;

export interface SessionCardData {
  key: string;
  mediaId?: string;
  mediaType?: "video" | "audio";
  durationSec?: number;
  title: string;
  subtitles: string[];
  details: string[];
}

export interface SessionCardLabels {
  /** Badge on the placeholder of audio-only media. Defaults to "Audio". */
  audioOnly?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Seconds into the video the poster frame is taken from. */
export const POSTER_SEEK_SECONDS = 3;

/** Distance past the viewport edge at which a card starts loading its poster. */
const POSTER_ROOT_MARGIN = "200px";

/** Clock-style duration: 4:05 or 1:02:03. */
export function formatClockDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, "0")}:${ss}`;
  return `${minutes}:${ss}`;
}

/** True once the element is near the viewport. Treats a missing observer as visible. */
function useNearViewport() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [near, setNear] = useState(() => typeof IntersectionObserver === "undefined");

  useEffect(() => {
    if (near) return;
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

// ── Poster ───────────────────────────────────────────────────────────────────

interface SessionPosterProps {
  mediaId?: string;
  mediaType?: "video" | "audio";
  durationSec?: number;
  showDuration: boolean;
  resolvePosterUrl?: ResolvePosterUrl;
  labels?: SessionCardLabels;
}

function SessionPoster({
  mediaId,
  mediaType,
  durationSec,
  showDuration,
  resolvePosterUrl,
  labels,
}: SessionPosterProps) {
  const { ref, near } = useNearViewport();
  const [url, setUrl] = useState<string | null>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const isAudio = mediaType === "audio";
  const wantsFrame = !!mediaId && !!resolvePosterUrl && !isAudio;

  useEffect(() => {
    if (!near || !wantsFrame || !mediaId || !resolvePosterUrl) return;
    let cancelled = false;
    resolvePosterUrl(mediaId)
      .then((resolved) => {
        if (cancelled) return;
        if (resolved) setUrl(resolved);
        else setFailed(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [near, wantsFrame, mediaId, resolvePosterUrl]);

  const showDurationBadge = showDuration && typeof durationSec === "number" && durationSec > 0;

  return (
    <div
      ref={ref}
      className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted"
      data-testid="session-card-poster"
    >
      {url && !failed ? (
        <video
          src={`${url}#t=${POSTER_SEEK_SECONDS}`}
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
              {labels?.audioOnly ?? "Audio"}
            </span>
          ) : (
            <PlayIcon className="h-8 w-8 opacity-60" />
          )}
        </div>
      ) : null}
      {showDurationBadge ? (
        <span className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-xs font-medium tabular-nums text-background">
          {formatClockDuration(durationSec as number)}
        </span>
      ) : null}
    </div>
  );
}

// ── Card + grid ──────────────────────────────────────────────────────────────

interface SessionCardProps {
  card: SessionCardData;
  showDuration: boolean;
  clickable: boolean;
  resolvePosterUrl?: ResolvePosterUrl;
  labels?: SessionCardLabels;
  onOpen?: (mediaId: string) => void;
}

function SessionCard({ card, showDuration, clickable, resolvePosterUrl, labels, onOpen }: SessionCardProps) {
  const body = (
    <>
      <SessionPoster
        mediaId={card.mediaId}
        mediaType={card.mediaType}
        durationSec={card.durationSec}
        showDuration={showDuration}
        resolvePosterUrl={resolvePosterUrl}
        labels={labels}
      />
      <div className="flex flex-1 flex-col gap-1 p-3 text-left">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">{card.title}</h3>
        {card.subtitles.map((line, i) => (
          <p key={`s-${i}`} className="line-clamp-1 text-sm text-muted-foreground">
            {line}
          </p>
        ))}
        {card.details.map((line, i) => (
          <p key={`d-${i}`} className="line-clamp-2 text-xs text-muted-foreground">
            {line}
          </p>
        ))}
      </div>
    </>
  );

  const base = "flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground";

  if (clickable && card.mediaId) {
    const mediaId = card.mediaId;
    return (
      <button
        type="button"
        onClick={() => onOpen?.(mediaId)}
        className={cn(
          base,
          "cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        {body}
      </button>
    );
  }
  return <div className={base}>{body}</div>;
}

export interface SessionCardGridProps {
  cards: SessionCardData[];
  config?: SessionCardConfig;
  clickable: boolean;
  resolvePosterUrl?: ResolvePosterUrl;
  labels?: SessionCardLabels;
  onOpen?: (mediaId: string) => void;
}

export function SessionCardGrid({ cards, config, clickable, resolvePosterUrl, labels, onOpen }: SessionCardGridProps) {
  const showDuration = config?.showDuration !== false;
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <SessionCard
          key={card.key}
          card={card}
          showDuration={showDuration}
          clickable={clickable}
          resolvePosterUrl={resolvePosterUrl}
          labels={labels}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
