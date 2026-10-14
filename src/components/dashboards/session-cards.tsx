import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { Badge } from "../Badge";
import { Skeleton } from "../Skeleton";
import { formatClockDuration } from "./format";
import { FileAudioIcon, PlayIcon } from "./icons";

const POSTER_SEEK_SECONDS = 3;
const POSTER_ROOT_MARGIN = "200px";
const CARD_GRID_CLASS = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
const SKELETON_CARD_COUNT = 3;
const MAX_CONCURRENT_FRAME_LOADS = 2;

// Source videos are huge; loading every card's frame at once stalls phones.
let activeFrameLoads = 0;
const frameLoadWaiters: Array<() => void> = [];

function acquireFrameSlot(onGranted: () => void): () => void {
  let held = false;
  let waiting = false;
  const grant = () => {
    waiting = false;
    held = true;
    activeFrameLoads += 1;
    onGranted();
  };
  if (activeFrameLoads < MAX_CONCURRENT_FRAME_LOADS) grant();
  else {
    waiting = true;
    frameLoadWaiters.push(grant);
  }
  return () => {
    if (waiting) {
      const i = frameLoadWaiters.indexOf(grant);
      if (i >= 0) frameLoadWaiters.splice(i, 1);
      waiting = false;
    }
    if (!held) return;
    held = false;
    activeFrameLoads -= 1;
    frameLoadWaiters.shift()?.();
  };
}

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
  thumbnailUrl?: string;
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
  const [thumbFailed, setThumbFailed] = useState(false);
  const [slotGranted, setSlotGranted] = useState(false);
  const { mediaUrl, thumbnailUrl, durationSec } = card;
  const isAudio = card.mediaType === "audio";
  const isVideo = !isAudio && !!mediaUrl;
  const showThumb = near && !isAudio && !!thumbnailUrl && !thumbFailed;
  const wantsFrame = near && isVideo && !failed && !showThumb;
  const showVideo = wantsFrame && slotGranted;
  const showPlayButton = clickable && isVideo;

  const releaseSlot = useRef<(() => void) | null>(null);
  const freeSlot = () => {
    releaseSlot.current?.();
    releaseSlot.current = null;
  };

  useEffect(() => {
    if (!wantsFrame) return;
    releaseSlot.current = acquireFrameSlot(() => setSlotGranted(true));
    return freeSlot;
  }, [wantsFrame]);

  return (
    <div ref={ref} className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
      {showThumb ? (
        <img
          src={thumbnailUrl}
          loading="lazy"
          decoding="async"
          alt=""
          onLoad={() => setFrameReady(true)}
          onError={() => setThumbFailed(true)}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
            frameReady ? "opacity-100" : "opacity-0",
          )}
        />
      ) : null}
      {showVideo ? (
        <video
          src={`${mediaUrl}#t=${POSTER_SEEK_SECONDS}`}
          preload="metadata"
          muted
          playsInline
          tabIndex={-1}
          aria-hidden="true"
          onLoadedData={() => {
            setFrameReady(true);
            freeSlot();
          }}
          onError={() => {
            setFailed(true);
            freeSlot();
          }}
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
          ) : showPlayButton ? null : (
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
