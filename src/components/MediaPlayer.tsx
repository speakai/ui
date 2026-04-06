"use client";

import { forwardRef, useRef, useEffect, useCallback, useState } from "react";
import { cn } from "../utils/cn";

// ── Inline SVG Icons (no external icon library) ─────────────────

const PlayIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8 5.14v14l11-7-11-7z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
);

const VolumeOnIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
  </svg>
);

const VolumeOffIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
  </svg>
);

const FullscreenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
  </svg>
);

const ExitFullscreenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
  </svg>
);

const RewindIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <text x="12" y="15.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="bold">10</text>
  </svg>
);

const ForwardIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <text x="12" y="15.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="7" fontWeight="bold">30</text>
  </svg>
);

// ── Helpers ─────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const DEFAULT_PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];

// ── Types ───────────────────────────────────────────────────────

export interface MediaPlayerCaption {
  src: string;
  label: string;
  language: string;
}

export interface MediaPlayerProps {
  src: string;
  poster?: string;
  mediaType: "audio" | "video";
  title?: string;
  seekTarget?: number | null;
  onSeekComplete?: () => void;
  onTimeUpdate?: (time: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
  onDurationChange?: (duration: number) => void;
  captions?: MediaPlayerCaption[];
  mode?: "default" | "dock";
  playbackRates?: number[];
  className?: string;
}

// ── Component ───────────────────────────────────────────────────

export const MediaPlayer = forwardRef<HTMLDivElement, MediaPlayerProps>(
  (
    {
      src,
      poster,
      mediaType,
      title,
      seekTarget,
      onSeekComplete,
      onTimeUpdate,
      onPlayStateChange,
      onDurationChange,
      captions,
      mode = "default",
      playbackRates = DEFAULT_PLAYBACK_RATES,
      className,
    },
    ref
  ) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const progressRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [playing, setPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [time, setTime] = useState(0);
    const [muted, setMuted] = useState(false);
    const [volume, setVolume] = useState(1);
    const [rate, setRate] = useState(1);
    const [showRates, setShowRates] = useState(false);
    const [hoverPct, setHoverPct] = useState<number | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const isAudio = mediaType === "audio";
    const isDocked = mode === "dock";
    const getEl = useCallback(
      () => (isAudio ? audioRef.current : videoRef.current),
      [isAudio]
    );
    const pct = duration > 0 ? (time / duration) * 100 : 0;

    // ── Media element event sync ────────────────────────────────

    useEffect(() => {
      const el = getEl();
      if (!el) return;

      const handleTimeUpdate = () => {
        setTime(el.currentTime);
        onTimeUpdate?.(el.currentTime);
      };
      const handleDuration = () => {
        const d = el.duration || 0;
        setDuration(d);
        onDurationChange?.(d);
      };
      const handlePlay = () => {
        setPlaying(true);
        onPlayStateChange?.(true);
      };
      const handleStop = () => {
        setPlaying(false);
        setShowControls(true);
        onPlayStateChange?.(false);
      };

      el.addEventListener("timeupdate", handleTimeUpdate);
      el.addEventListener("loadedmetadata", handleDuration);
      el.addEventListener("durationchange", handleDuration);
      el.addEventListener("play", handlePlay);
      el.addEventListener("pause", handleStop);
      el.addEventListener("ended", handleStop);

      return () => {
        el.removeEventListener("timeupdate", handleTimeUpdate);
        el.removeEventListener("loadedmetadata", handleDuration);
        el.removeEventListener("durationchange", handleDuration);
        el.removeEventListener("play", handlePlay);
        el.removeEventListener("pause", handleStop);
        el.removeEventListener("ended", handleStop);
      };
    }, [getEl, onTimeUpdate, onPlayStateChange, onDurationChange]);

    // ── Seek target sync ────────────────────────────────────────

    useEffect(() => {
      const el = getEl();
      if (seekTarget != null && el) {
        el.currentTime = seekTarget;
        el.play().catch(() => {});
        onSeekComplete?.();
      }
    }, [seekTarget, onSeekComplete, getEl]);

    // ── Fullscreen tracking ─────────────────────────────────────

    useEffect(() => {
      const handler = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handler);
      return () => document.removeEventListener("fullscreenchange", handler);
    }, []);

    // ── Auto-hide controls for video ────────────────────────────

    const resetHideTimer = useCallback(() => {
      setShowControls(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (playing && !isAudio && !isDocked) {
        hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
      }
    }, [playing, isAudio, isDocked]);

    // ── Playback actions ────────────────────────────────────────

    const togglePlay = useCallback(() => {
      const el = getEl();
      if (!el) return;
      el.paused ? el.play().catch(() => {}) : el.pause();
    }, [getEl]);

    const seekBy = useCallback(
      (s: number) => {
        const el = getEl();
        if (!el) return;
        el.currentTime = Math.max(
          0,
          Math.min(el.currentTime + s, el.duration || 0)
        );
      },
      [getEl]
    );

    const toggleMute = useCallback(() => {
      const el = getEl();
      if (!el) return;
      el.muted = !el.muted;
      setMuted(el.muted);
      if (!el.muted && el.volume === 0) {
        el.volume = 0.5;
        setVolume(0.5);
      }
    }, [getEl]);

    const changeVolume = useCallback(
      (v: number) => {
        const el = getEl();
        if (el) {
          el.volume = v;
          el.muted = v === 0;
        }
        setVolume(v);
        setMuted(v === 0);
      },
      [getEl]
    );

    const changeRate = useCallback(
      (r: number) => {
        const el = getEl();
        if (el) el.playbackRate = r;
        setRate(r);
        setShowRates(false);
      },
      [getEl]
    );

    const toggleFullscreen = useCallback(() => {
      const c = containerRef.current;
      if (!c) return;
      document.fullscreenElement
        ? document.exitFullscreen()
        : c.requestFullscreen().catch(() => {});
    }, []);

    // ── Progress bar interaction ────────────────────────────────

    const handleProgressClick = useCallback(
      (e: React.MouseEvent) => {
        const bar = progressRef.current;
        const el = getEl();
        if (!bar || !el) return;
        const rect = bar.getBoundingClientRect();
        const pad = 16; // px-4
        el.currentTime =
          Math.max(0, Math.min(1, (e.clientX - rect.left - pad) / (rect.width - 2 * pad))) *
          (el.duration || 0);
      },
      [getEl]
    );

    const handleProgressHover = useCallback(
      (e: React.MouseEvent) => {
        const bar = progressRef.current;
        if (!bar || !duration) return;
        const rect = bar.getBoundingClientRect();
        const pad = 16; // px-4
        setHoverPct(
          Math.max(0, Math.min(1, (e.clientX - rect.left - pad) / (rect.width - 2 * pad)))
        );
      },
      [duration]
    );

    // ── Keyboard shortcuts ──────────────────────────────────────

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        switch (e.key) {
          case " ":
            e.preventDefault();
            togglePlay();
            break;
          case "ArrowLeft":
            e.preventDefault();
            seekBy(-10);
            break;
          case "ArrowRight":
            e.preventDefault();
            seekBy(30);
            break;
          case "f":
            e.preventDefault();
            if (!isAudio && !isDocked) toggleFullscreen();
            break;
          case "m":
            e.preventDefault();
            toggleMute();
            break;
        }
      },
      [togglePlay, seekBy, toggleFullscreen, toggleMute, isAudio, isDocked]
    );

    // ── Render nothing if no source ─────────────────────────────

    if (!src) return null;

    // ── Captions track elements ─────────────────────────────────

    const captionTracks = captions?.map((c) => (
      <track
        key={c.language}
        kind="captions"
        src={c.src}
        srcLang={c.language}
        label={c.label}
        default={captions.indexOf(c) === 0}
      />
    ));

    // ── Shared progress bar ─────────────────────────────────────

    const renderProgress = (light: boolean) => (
      <div
        ref={progressRef}
        onClick={(e) => {
          e.stopPropagation();
          handleProgressClick(e);
        }}
        onMouseMove={handleProgressHover}
        onMouseLeave={() => setHoverPct(null)}
        className="group relative flex h-6 cursor-pointer items-center px-4"
      >
        {/* Track */}
        <div
          className={cn(
            "relative h-1 w-full rounded-full transition-all group-hover:h-1.5",
            light ? "bg-muted-foreground/20" : "bg-foreground/15"
          )}
        >
          {/* Played */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Scrubber */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-primary shadow-md opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            left: `calc(${pct}% * (100% - 32px) / 100% + 16px)`,
            transform: "translate(-50%, -50%)",
          }}
        />
        {/* Hover tooltip */}
        {hoverPct != null && (
          <div
            className="absolute -top-7 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background tabular-nums pointer-events-none"
            style={{ left: `${hoverPct * 100}%` }}
          >
            {formatTime(hoverPct * duration)}
          </div>
        )}
      </div>
    );

    // ── Shared controls row ─────────────────────────────────────

    const renderControls = (light: boolean, compact = false) => {
      const txtCls = light
        ? "text-muted-foreground/70 hover:text-foreground"
        : "text-muted-foreground hover:text-foreground";
      const btnCls = cn(
        "flex items-center justify-center rounded-full transition-colors",
        compact ? "h-8 w-8" : "h-9 w-9",
        txtCls,
        light ? "hover:bg-muted-foreground/10" : "hover:bg-foreground/10"
      );

      return (
        <div
          className={cn(
            "flex items-center gap-0.5 px-3",
            compact ? "h-10" : "h-11"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={cn(btnCls, compact ? "h-8 w-8" : "h-10 w-10")}
          >
            {playing ? (
              <PauseIcon className="h-5 w-5" />
            ) : (
              <PlayIcon
                className={cn("h-5 w-5", !compact && "ml-0.5")}
              />
            )}
          </button>

          <button
            onClick={() => seekBy(-10)}
            className={btnCls}
            title="Rewind 10s"
          >
            <RewindIcon className="h-[18px] w-[18px]" />
          </button>
          <button
            onClick={() => seekBy(30)}
            className={btnCls}
            title="Forward 30s"
          >
            <ForwardIcon className="h-[18px] w-[18px]" />
          </button>

          {/* Time */}
          <span
            className={cn(
              "ml-1 text-xs tabular-nums whitespace-nowrap",
              light ? "text-muted-foreground/60" : "text-muted-foreground"
            )}
          >
            {formatTime(time)}
            <span className="mx-0.5 opacity-40">/</span>
            {formatTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Playback rate */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowRates(!showRates);
              }}
              className={cn(
                "flex h-8 items-center rounded-lg px-2 text-xs font-bold tabular-nums transition-colors",
                rate !== 1 ? "bg-primary/20 text-primary" : txtCls,
                light
                  ? "hover:bg-muted-foreground/10"
                  : "hover:bg-foreground/10"
              )}
            >
              {rate}x
            </button>
            {showRates && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowRates(false)}
                />
                <div className="absolute bottom-full right-0 z-50 mb-2 min-w-[64px] rounded-lg border border-border bg-popover py-1 shadow-xl">
                  {playbackRates.map((r) => (
                    <button
                      key={r}
                      onClick={(e) => {
                        e.stopPropagation();
                        changeRate(r);
                      }}
                      className={cn(
                        "flex w-full px-3 py-1.5 text-xs tabular-nums transition-colors",
                        r === rate
                          ? "text-primary font-bold bg-primary/10"
                          : "text-popover-foreground hover:bg-muted"
                      )}
                    >
                      {r}x
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Volume */}
          <div className="group/vol flex items-center">
            <button onClick={toggleMute} className={btnCls}>
              {muted || volume === 0 ? (
                <VolumeOffIcon className="h-[18px] w-[18px]" />
              ) : (
                <VolumeOnIcon className="h-[18px] w-[18px]" />
              )}
            </button>
            <div
              className={cn(
                "overflow-hidden transition-all duration-200",
                compact
                  ? "w-0 group-hover/vol:w-14 group-hover/vol:ml-1"
                  : "w-0 group-hover/vol:w-16 group-hover/vol:ml-1"
              )}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={(e) => changeVolume(parseFloat(e.target.value))}
                className={cn(
                  "h-1 cursor-pointer appearance-none rounded-full bg-foreground/20 accent-primary",
                  "[&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:appearance-none",
                  compact ? "w-12" : "w-14"
                )}
              />
            </div>
          </div>

          {/* Fullscreen -- video only, not in compact/dock */}
          {!isAudio && !compact && (
            <button
              onClick={toggleFullscreen}
              className={btnCls}
              title="Fullscreen (f)"
            >
              {isFullscreen ? (
                <ExitFullscreenIcon className="h-[18px] w-[18px]" />
              ) : (
                <FullscreenIcon className="h-[18px] w-[18px]" />
              )}
            </button>
          )}
        </div>
      );
    };

    // ── Main render ─────────────────────────────────────────────

    return (
      <div
        ref={ref}
        className={cn("relative focus-visible:outline-hidden", className)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Hidden audio element */}
        {isAudio && <audio ref={audioRef} src={src} preload="metadata" />}

        {/* Hidden video element for dock mode */}
        {!isAudio && isDocked && (
          <video
            ref={videoRef}
            src={src}
            preload="metadata"
            playsInline
            className="hidden"
          >
            {captionTracks}
          </video>
        )}

        {/* ── Docked Player ── */}
        {isDocked && (
          <div
            className="border-t border-border bg-card/95 backdrop-blur"
            ref={containerRef}
          >
            {title && (
              <div className="px-4 pt-2 pb-0.5">
                <p className="truncate text-xs font-medium text-foreground">
                  {title}
                </p>
              </div>
            )}
            {renderProgress(false)}
            {renderControls(false, true)}
          </div>
        )}

        {/* ── Audio Player ── */}
        {isAudio && !isDocked && (
          <div className="bg-card" ref={containerRef}>
            {title && (
              <div className="px-4 pt-4 pb-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {title}
                </p>
              </div>
            )}
            {renderProgress(false)}
            {renderControls(false)}
          </div>
        )}

        {/* ── Video Player ── */}
        {!isAudio && !isDocked && (
          <div
            ref={containerRef}
            className="group/video relative aspect-video bg-background"
            onMouseMove={resetHideTimer}
            onMouseLeave={() => {
              if (playing) setShowControls(false);
            }}
            onClick={(e) => {
              if ((e.target as HTMLElement).tagName === "VIDEO") togglePlay();
            }}
            onDoubleClick={(e) => {
              if ((e.target as HTMLElement).tagName === "VIDEO")
                toggleFullscreen();
            }}
          >
            <video
              ref={videoRef}
              src={src}
              poster={poster}
              preload="metadata"
              playsInline
              className="h-full w-full object-contain"
              onContextMenu={(e) => e.preventDefault()}
            >
              {captionTracks}
            </video>

            {/* Center play button -- when paused */}
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 pointer-events-none">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-card/90 text-foreground shadow-2xl pointer-events-auto cursor-pointer transition-transform hover:scale-110 active:scale-95"
                  onClick={togglePlay}
                >
                  <PlayIcon className="h-7 w-7 ml-1" />
                </div>
              </div>
            )}

            {/* Bottom overlay -- gradient + controls */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/90 via-background/50 to-transparent pt-20 transition-opacity duration-300",
                showControls || !playing
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              )}
            >
              {renderProgress(true)}
              {renderControls(true)}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MediaPlayer.displayName = "MediaPlayer";
