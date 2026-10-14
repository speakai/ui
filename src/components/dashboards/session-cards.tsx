import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Badge } from "../Badge";
import { Skeleton } from "../Skeleton";
import { formatClockDuration, getTitleInitials } from "./format";
import { FileAudioIcon, PlayIcon } from "./icons";

const POSTER_SEEK_SECONDS = 3;
const POSTER_ROOT_MARGIN = "200px";
const CARD_GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const SKELETON_CARD_COUNT = 3;

export interface SessionCardConfig {
  titleColumn?: string;
  subtitleColumns?: string[];
  detailColumns?: string[];
  showDuration?: boolean;
}

export interface SessionCardData {
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
}

function SessionPoster({ card, showDuration, clickable, audioOnlyLabel }: SessionPosterProps) {
  const { ref, near } = useNearViewport();
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { mediaUrl, durationSec } = card;
  const isAudio = card.mediaType === "audio";
  const isVideo = !isAudio && !!mediaUrl;
  const showVideo = near && isVideo && !failed;
  const showPlayButton = clickable && isVideo;
  const showFallback = !frameReady || failed;
  const initials = getTitleInitials(card.title);

  return (
    <div
      ref={ref}
      className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-black bg-gradient-to-br from-primary/30 to-black"
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
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300 motion-reduce:transition-none",
            frameReady ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {showFallback ? (
        <div
          className={cn(
            "absolute inset-0 flex text-white/80",
            // With a play button centred, the monogram moves to the corner so the two never overlap.
            initials && !isAudio && showPlayButton ? "items-end justify-start p-3" : "items-center justify-center",
          )}
        >
          {isAudio ? (
            <span className="flex flex-col items-center gap-1 text-xs font-medium">
              <FileAudioIcon className="h-8 w-8" />
              {audioOnlyLabel ?? "Audio"}
            </span>
          ) : initials ? (
            <span
              aria-hidden="true"
              className={cn("select-none font-semibold tracking-wide", showPlayButton ? "text-2xl" : "text-3xl")}
            >
              {initials}
            </span>
          ) : showPlayButton ? null : (
            <PlayIcon className="h-8 w-8 opacity-60" />
          )}
        </div>
      ) : null}
      {showPlayButton ? (
        <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true" data-testid="session-card-play">
          <span className="rounded-full bg-primary p-3 text-primary-foreground shadow-lg ring-2 ring-white/70 transition-transform group-hover:scale-110 group-focus-within:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100">
            <PlayIcon className="ms-0.5 h-6 w-6 fill-current" />
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
        mediaId &&
          "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
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
          <Badge variant="default" size="sm" role={undefined} className="mb-1 max-w-full self-start rounded-md">
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
          className="absolute inset-0 cursor-pointer rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
        />
      ) : null}
    </article>
  );
}

interface SessionCardGridProps {
  cards: SessionCardData[];
  config?: SessionCardConfig;
  clickable: boolean;
  audioOnlyLabel?: string;
  onOpen?: (mediaId: string) => void;
}

export function SessionCardGrid({
  cards,
  config,
  clickable,
  audioOnlyLabel,
  onOpen,
}: SessionCardGridProps) {
  const showDuration = config?.showDuration !== false;
  return (
    <div className={CARD_GRID_CLASS}>
      {cards.map((card) => (
        <SessionCard
          key={card.key}
          card={card}
          showDuration={showDuration}
          clickable={clickable}
          audioOnlyLabel={audioOnlyLabel}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}

export function SessionCardGridSkeleton() {
  return (
    <div className={CARD_GRID_CLASS} aria-hidden="true">
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
  );
}
