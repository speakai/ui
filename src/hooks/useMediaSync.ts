import { useState, useCallback } from "react";

export interface UseMediaSyncReturn {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  seekTarget: number | null;
  seekTo: (time: number) => void;
  clearSeekTarget: () => void;
}

export function useMediaSync(): UseMediaSyncReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [seekTarget, setSeekTarget] = useState<number | null>(null);

  const seekTo = useCallback((time: number) => setSeekTarget(time), []);
  const clearSeekTarget = useCallback(() => setSeekTarget(null), []);

  return {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    seekTarget,
    seekTo,
    clearSeekTarget,
  };
}
