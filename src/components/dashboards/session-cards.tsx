import { useEffect, useRef, useState } from "react";
import { cn } from "../../utils/cn";
import { formatClockDuration } from "./format";
import { FileAudioIcon, PlayIcon } from "./icons";

const POSTER_SEEK_SECONDS = 3;
const POSTER_ROOT_MARGIN = "200px";

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

interface SessionPosterProps {
  card: SessionCardData;
  showDuration: boolean;
  audioOnlyLabel?: string;
}

function SessionPoster({ card, showDuration, audioOnlyLabel }: SessionPosterProps) {
  const { ref, near } = useNearViewport();
  const [frameReady, setFrameReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const { mediaUrl, durationSec } = card;
  const isAudio = card.mediaType === "audio";
  const showVideo = near && !isAudio && !!mediaUrl && !failed;

  return (
    <div ref={ref} className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
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
          ) : (
            <PlayIcon className="h-8 w-8 opacity-60" />
          )}
        </div>
      ) : null}
      {showDuration && typeof durationSec === "number" && durationSec > 0 ? (
        <span className="absolute bottom-2 right-2 rounded-md bg-foreground/80 px-1.5 py-0.5 text-xs font-medium tabular-nums text-background">
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
  return (
    <article
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground",
        mediaId && "transition-shadow hover:shadow-md",
      )}
    >
      <SessionPoster card={card} showDuration={showDuration} audioOnlyLabel={audioOnlyLabel} />
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
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
