"use client";

import { forwardRef, useMemo } from "react";
import { cn } from "../utils/cn";

// ── Types ───────────────────────────────────────────────────────

export interface TranscriptWord {
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface TranscriptSegment {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerColor?: string;
  startTime: number;
  endTime: number;
  words: TranscriptWord[];
}

export interface TranscriptViewProps {
  segments: TranscriptSegment[];
  currentTime?: number;
  onWordClick?: (time: number) => void;
  showTimestamps?: boolean;
  highlightCurrent?: boolean;
  className?: string;
}

// ── Helpers ─────────────────────────────────────────────────────

function formatTimestamp(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

const SPEAKER_COLORS = [
  "hsl(271, 80%, 60%)",
  "hsl(210, 80%, 55%)",
  "hsl(340, 75%, 55%)",
  "hsl(162, 70%, 45%)",
  "hsl(25, 85%, 55%)",
  "hsl(45, 80%, 50%)",
];

// ── Component ───────────────────────────────────────────────────

export const TranscriptView = forwardRef<HTMLDivElement, TranscriptViewProps>(
  (
    {
      segments,
      currentTime = 0,
      onWordClick,
      showTimestamps = true,
      highlightCurrent = true,
      className,
    },
    ref
  ) => {
    // Build a stable speaker → color map
    const speakerColorMap = useMemo(() => {
      const map = new Map<string, string>();
      const uniqueSpeakers = [...new Set(segments.map((s) => s.speakerId))];
      uniqueSpeakers.forEach((id, i) => {
        const seg = segments.find((s) => s.speakerId === id);
        map.set(id, seg?.speakerColor || SPEAKER_COLORS[i % SPEAKER_COLORS.length]);
      });
      return map;
    }, [segments]);

    // Group consecutive segments by speaker
    const grouped = useMemo(() => {
      const groups: { speakerId: string; speakerName: string; startTime: number; segments: TranscriptSegment[] }[] = [];
      for (const seg of segments) {
        const last = groups[groups.length - 1];
        if (last && last.speakerId === seg.speakerId) {
          last.segments.push(seg);
        } else {
          groups.push({
            speakerId: seg.speakerId,
            speakerName: seg.speakerName,
            startTime: seg.startTime,
            segments: [seg],
          });
        }
      }
      return groups;
    }, [segments]);

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        {grouped.map((group, gi) => {
          const color = speakerColorMap.get(group.speakerId) || SPEAKER_COLORS[0];
          return (
            <div key={gi} className="flex gap-3">
              {/* Speaker label column */}
              <div className="flex-shrink-0 w-28 pt-0.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {group.speakerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">
                      {group.speakerName}
                    </p>
                    {showTimestamps && (
                      <p className="text-[10px] text-muted-foreground tabular-nums">
                        {formatTimestamp(group.startTime)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Words */}
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-relaxed text-foreground/90">
                  {group.segments.map((seg) =>
                    seg.words.map((word, wi) => {
                      const isActive =
                        highlightCurrent &&
                        currentTime >= word.startTime &&
                        currentTime < word.endTime;
                      const isPast = currentTime >= word.endTime;

                      return (
                        <span
                          key={`${seg.id}-${wi}`}
                          onClick={() => onWordClick?.(word.startTime)}
                          className={cn(
                            "transition-colors duration-150",
                            onWordClick && "cursor-pointer hover:text-primary",
                            isActive && "bg-primary/20 text-primary font-medium rounded-sm px-0.5 -mx-0.5",
                            !isActive && isPast && highlightCurrent && "text-foreground",
                            !isActive && !isPast && highlightCurrent && "text-muted-foreground"
                          )}
                        >
                          {word.text}{" "}
                        </span>
                      );
                    })
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);

TranscriptView.displayName = "TranscriptView";
