"use client";

import { forwardRef, HTMLAttributes, useCallback, useMemo } from "react";
import { cn } from "../utils/cn";
import { inputBase } from "../utils/inputBase";

const errorRing = "border-danger focus-visible:ring-danger";
const defaultRing = "border-input";

// ── Helpers ──────────────────────────────────────────────────────────────────

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface DatePickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
  min?: Date;
  max?: Date;
  disabled?: boolean;
  /** Pass `true` for red border only, or a string to show an error message. */
  error?: boolean | string;
  label?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  (
    {
      className,
      value,
      onChange,
      placeholder,
      min,
      max,
      disabled = false,
      error,
      label,
      ...props
    },
    ref,
  ) => {
    const minStr = useMemo(() => (min ? toDateString(min) : undefined), [min]);
    const maxStr = useMemo(() => (max ? toDateString(max) : undefined), [max]);
    const valueStr = useMemo(
      () => (value ? toDateString(value) : ""),
      [value],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        if (raw) {
          // Parse as local date (YYYY-MM-DD)
          const [y, m, d] = raw.split("-").map(Number);
          onChange(new Date(y, m - 1, d));
        }
      },
      [onChange],
    );

    const inputId = props.id ?? (label ? `datepicker-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type="date"
          value={valueStr}
          onChange={handleChange}
          min={minStr}
          max={maxStr}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBase,
            "h-10",
            error ? errorRing : defaultRing,
          )}
        />
        {typeof error === "string" && error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  },
);

DatePicker.displayName = "DatePicker";
