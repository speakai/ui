"use client";

import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  TouchEvent,
  useCallback,
  useRef,
} from "react";
import { cn } from "../utils/cn";

export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  /** Renders as inline element without label/value header — for use in compact flex rows */
  inline?: boolean;
  /** Content rendered inside the track (e.g., markers for media timelines) */
  trackChildren?: React.ReactNode;
}

export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value,
      onChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      showValue = true,
      disabled = false,
      inline = false,
      trackChildren,
      className,
      ...props
    },
    ref,
  ) => {
    const trackRef = useRef<HTMLDivElement>(null);

    const clamp = useCallback(
      (v: number) => Math.min(max, Math.max(min, v)),
      [min, max],
    );

    const snapToStep = useCallback(
      (v: number) => {
        const stepped = Math.round((v - min) / step) * step + min;
        return clamp(stepped);
      },
      [min, step, clamp],
    );

    const getValueFromPosition = useCallback(
      (clientX: number) => {
        const track = trackRef.current;
        if (!track) return value;
        const rect = track.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        return snapToStep(min + ratio * (max - min));
      },
      [min, max, value, snapToStep],
    );

    const handleTrackClick = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        onChange(getValueFromPosition(e.clientX));
      },
      [disabled, getValueFromPosition, onChange],
    );

    const handleMouseDown = useCallback(
      (e: MouseEvent<HTMLDivElement>) => {
        if (disabled) return;
        e.preventDefault();

        const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
          onChange(getValueFromPosition(moveEvent.clientX));
        };

        const handleMouseUp = () => {
          document.removeEventListener("mousemove", handleMouseMove);
          document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
      },
      [disabled, getValueFromPosition, onChange],
    );

    const handleTouchStart = useCallback(
      (e: TouchEvent<HTMLDivElement>) => {
        if (disabled) return;

        const handleTouchMove = (moveEvent: globalThis.TouchEvent) => {
          const touch = moveEvent.touches[0];
          if (touch) onChange(getValueFromPosition(touch.clientX));
        };

        const handleTouchEnd = () => {
          document.removeEventListener("touchmove", handleTouchMove);
          document.removeEventListener("touchend", handleTouchEnd);
        };

        document.addEventListener("touchmove", handleTouchMove, { passive: true });
        document.addEventListener("touchend", handleTouchEnd);

        // Handle initial touch position
        const touch = e.touches[0];
        if (touch) onChange(getValueFromPosition(touch.clientX));
      },
      [disabled, getValueFromPosition, onChange],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (disabled) return;

        let newValue: number | null = null;

        switch (e.key) {
          case "ArrowRight":
          case "ArrowUp":
            newValue = clamp(value + step);
            break;
          case "ArrowLeft":
          case "ArrowDown":
            newValue = clamp(value - step);
            break;
          case "Home":
            newValue = min;
            break;
          case "End":
            newValue = max;
            break;
          case "PageUp":
            newValue = clamp(value + step * 10);
            break;
          case "PageDown":
            newValue = clamp(value - step * 10);
            break;
          default:
            return;
        }

        e.preventDefault();
        onChange(newValue);
      },
      [disabled, value, step, min, max, clamp, onChange],
    );

    const percentage = ((clamp(value) - min) / (max - min)) * 100;
    const sliderId = props.id ?? (label ? `slider-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    const track = (
      <div
        ref={trackRef}
        id={sliderId}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamp(value)}
        aria-label={label}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
        onClick={handleTrackClick}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative h-2 cursor-pointer rounded-full bg-muted",
          inline ? "flex-1" : "w-full",
          "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        {/* Fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          style={{ width: `${percentage}%` }}
          aria-hidden="true"
        />

        {/* Track overlay content (markers, annotations) */}
        {trackChildren}

        {/* Thumb */}
        <div
          aria-hidden="true"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className={cn(
            "absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-primary bg-background shadow-sm transition-shadow",
            !disabled && "hover:shadow-md active:scale-105",
            disabled && "pointer-events-none",
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>
    );

    if (inline) {
      return (
        <div ref={ref} className={cn("inline-flex items-center", className)} {...props}>
          {track}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("flex flex-col gap-2", className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <label
                htmlFor={sliderId}
                className={cn(
                  "text-sm font-medium text-foreground",
                  disabled && "opacity-50",
                )}
              >
                {label}
              </label>
            )}
            {showValue && (
              <span
                className={cn(
                  "text-sm tabular-nums text-muted-foreground",
                  disabled && "opacity-50",
                )}
              >
                {value}
              </span>
            )}
          </div>
        )}
        {track}
      </div>
    );
  },
);
Slider.displayName = "Slider";
