"use client";

import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ClipboardEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OTPInputProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Number of digit boxes (default 6) */
  length?: number;
  /** Current OTP value */
  value: string;
  /** Called when the value changes */
  onChange: (value: string) => void;
  /** Pass `true` for red border only, or a string to show an error message. */
  error?: boolean | string;
  disabled?: boolean;
  autoFocus?: boolean;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const digitBase = [
  "flex h-12 w-10 items-center justify-center rounded-lg border bg-background text-center text-lg font-semibold text-foreground",
  "transition-colors",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const errorRing = "border-danger focus-visible:ring-danger";
const defaultRing = "border-input";

// ── Component ────────────────────────────────────────────────────────────────

export const OTPInput = forwardRef<HTMLDivElement, OTPInputProps>(
  (
    {
      className,
      length = 6,
      value,
      onChange,
      error,
      disabled = false,
      autoFocus = false,
      ...props
    },
    ref,
  ) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

    const focusInput = useCallback(
      (index: number) => {
        const clamped = Math.max(0, Math.min(index, length - 1));
        inputsRef.current[clamped]?.focus();
      },
      [length],
    );

    useEffect(() => {
      if (autoFocus) {
        focusInput(0);
      }
    }, [autoFocus, focusInput]);

    const handleChange = useCallback(
      (index: number, char: string) => {
        if (!/^\d?$/.test(char)) return;

        const arr = digits.slice();
        arr[index] = char;
        const next = arr.join("");
        onChange(next);

        if (char && index < length - 1) {
          focusInput(index + 1);
        }
      },
      [digits, onChange, length, focusInput],
    );

    const handleKeyDown = useCallback(
      (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          if (digits[index]) {
            handleChange(index, "");
          } else if (index > 0) {
            handleChange(index - 1, "");
            focusInput(index - 1);
          }
          return;
        }

        if (e.key === "ArrowLeft" && index > 0) {
          e.preventDefault();
          focusInput(index - 1);
          return;
        }

        if (e.key === "ArrowRight" && index < length - 1) {
          e.preventDefault();
          focusInput(index + 1);
        }
      },
      [digits, handleChange, focusInput, length],
    );

    const handlePaste = useCallback(
      (e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasted = e.clipboardData
          .getData("text/plain")
          .replace(/\D/g, "")
          .slice(0, length);

        if (pasted) {
          onChange(pasted.padEnd(length, "").slice(0, length).replace(/ /g, ""));
          // Focus the last filled digit or the next empty one
          focusInput(Math.min(pasted.length, length - 1));
        }
      },
      [onChange, length, focusInput],
    );

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div
          role="group"
          aria-label="One-time password input"
          className="flex items-center gap-2"
        >
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputsRef.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={disabled}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={error ? true : undefined}
              className={cn(
                digitBase,
                error ? errorRing : defaultRing,
              )}
              onChange={(e) => {
                const val = e.target.value;
                // Take only the last character (handles overwrite)
                handleChange(index, val.slice(-1));
              }}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
        {typeof error === "string" && error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  },
);

OTPInput.displayName = "OTPInput";
