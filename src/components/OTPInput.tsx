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
import { FieldError, useFieldError } from "./FieldError";

// ── Types ────────────────────────────────────────────────────────────────────

export interface OTPInputProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Number of digit boxes (default 6) */
  length?: number;
  /** Current OTP value */
  value: string;
  /** Called when the value changes */
  onChange: (value: string) => void;
  /**
   * Pass `true` for red border only, or a string to show an error message.
   * The message is announced (`role="alert"`) and linked to every box with
   * `aria-describedby`.
   */
  error?: boolean | string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Accessible name of the group of boxes (default "Verification code"). */
  "aria-label"?: string;
  /** Id of a visible element that names the group. Takes the place of `aria-label`. */
  "aria-labelledby"?: string;
  /**
   * Id(s) of elements that describe the code, such as an error message the
   * consumer renders. Added to every box, before the component's own error id.
   */
  "aria-describedby"?: string;
  /** Mark the boxes invalid (and show the error border) without passing `error`. */
  "aria-invalid"?: boolean | "true" | "false" | "grammar" | "spelling";
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

const DEFAULT_GROUP_LABEL = "Verification code";

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
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref,
  ) => {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const { errorId, errorMessage, ariaDescribedBy: describedBy } = useFieldError(error, ariaDescribedBy);
    const invalidByProp =
      ariaInvalid !== undefined && ariaInvalid !== false && ariaInvalid !== "false";
    const invalid = Boolean(error) || invalidByProp;
    const groupLabel = ariaLabelledBy ? ariaLabel : (ariaLabel ?? DEFAULT_GROUP_LABEL);

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

    /**
     * Write several digits (paste or autofill) into the boxes, starting at
     * `index`. A full-length code always starts at the first box. The start
     * never passes the first empty box, because `value` has no gaps.
     */
    const fillFrom = useCallback(
      (index: number, raw: string) => {
        const incoming = raw.replace(/\D/g, "").slice(0, length);
        if (!incoming) return;

        const current = value.slice(0, length);
        const start = incoming.length >= length ? 0 : Math.min(index, current.length);
        const arr = current.split("");
        incoming
          .slice(0, length - start)
          .split("")
          .forEach((char, offset) => {
            arr[start + offset] = char;
          });
        onChange(arr.join(""));
        focusInput(start + incoming.length);
      },
      [value, onChange, length, focusInput],
    );

    const handleInputValue = useCallback(
      (index: number, raw: string) => {
        const old = digits[index];
        // Typing over a box that already holds a digit gives "old+new" or
        // "new+old" (when the caret was not selecting the digit).
        if (old && /^\d{2}$/.test(raw) && raw.includes(old)) {
          handleChange(index, raw.startsWith(old) ? raw[1] : raw[0]);
          return;
        }
        if (raw.length > 1) {
          fillFrom(index, raw);
          return;
        }
        handleChange(index, raw);
      },
      [digits, handleChange, fillFrom],
    );

    const handlePaste = useCallback(
      (index: number, e: ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        fillFrom(index, e.clipboardData.getData("text/plain"));
      },
      [fillFrom],
    );

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        <div
          role="group"
          aria-label={groupLabel}
          aria-labelledby={ariaLabelledBy}
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
              // Only the first box asks for the one-time code, so iOS and
              // Android offer the code from mail or SMS once, there.
              autoComplete={index === 0 ? "one-time-code" : "off"}
              // No maxLength: autofill and some keyboards put the whole code
              // into one box, and handleInputValue spreads it.
              value={digit}
              disabled={disabled}
              aria-label={`Digit ${index + 1} of ${length}`}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={describedBy}
              className={cn(
                digitBase,
                invalid ? errorRing : defaultRing,
              )}
              onChange={(e) => handleInputValue(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              onFocus={(e) => e.target.select()}
            />
          ))}
        </div>
        <FieldError id={errorId} role="alert">
          {errorMessage}
        </FieldError>
      </div>
    );
  },
);

OTPInput.displayName = "OTPInput";
