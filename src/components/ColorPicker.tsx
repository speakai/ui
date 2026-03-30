"use client";

import {
  forwardRef,
  HTMLAttributes,
  useCallback,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";
import { inputBase } from "../utils/inputBase";

// ── Helpers ──────────────────────────────────────────────────────────────────

const HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(value: string): string | null {
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return HEX_REGEX.test(withHash) ? withHash.toLowerCase() : null;
}

// ── ColorPicker ──────────────────────────────────────────────────────────────

export interface ColorPickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current hex color value (e.g. "#a855f7") */
  value: string;
  /** Called when the color changes */
  onChange: (color: string) => void;
  /** Optional array of hex colors to show as preset swatches */
  presetColors?: string[];
  /** Show hex text input next to the color picker (default true) */
  showInput?: boolean;
  /** Label above the picker */
  label?: string;
  disabled?: boolean;
}

export const ColorPicker = forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      className,
      value,
      onChange,
      presetColors,
      showInput = true,
      label,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = useState(value);
    const [inputError, setInputError] = useState(false);
    const nativeRef = useRef<HTMLInputElement>(null);

    const handleNativeChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const hex = e.target.value.toLowerCase();
        setInputValue(hex);
        setInputError(false);
        onChange(hex);
      },
      [onChange],
    );

    const handleTextChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setInputValue(raw);

        const normalized = normalizeHex(raw);
        if (normalized) {
          setInputError(false);
          onChange(normalized);
        } else {
          setInputError(true);
        }
      },
      [onChange],
    );

    const handleTextBlur = useCallback(() => {
      const normalized = normalizeHex(inputValue);
      if (normalized) {
        setInputValue(normalized);
        setInputError(false);
      } else {
        setInputValue(value);
        setInputError(false);
      }
    }, [inputValue, value]);

    const handleSwatchClick = useCallback(
      (color: string) => {
        if (disabled) return;
        const normalized = normalizeHex(color);
        if (normalized) {
          setInputValue(normalized);
          setInputError(false);
          onChange(normalized);
        }
      },
      [disabled, onChange],
    );

    // Sync inputValue when value prop changes externally
    const lastValueRef = useRef(value);
    if (value !== lastValueRef.current) {
      lastValueRef.current = value;
      if (normalizeHex(value)) {
        setInputValue(value.toLowerCase());
        setInputError(false);
      }
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div className="flex items-center gap-2">
          {/* Native color input */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => nativeRef.current?.click()}
            className={cn(
              "relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border transition-colors",
              "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              disabled && "cursor-not-allowed opacity-50",
            )}
            style={{ backgroundColor: value }}
            aria-label="Pick a color"
          >
            <input
              ref={nativeRef}
              type="color"
              value={value}
              onChange={handleNativeChange}
              disabled={disabled}
              className="absolute inset-0 cursor-pointer opacity-0"
              tabIndex={-1}
              aria-hidden="true"
            />
          </button>

          {/* Hex text input */}
          {showInput && (
            <input
              type="text"
              value={inputValue}
              onChange={handleTextChange}
              onBlur={handleTextBlur}
              disabled={disabled}
              placeholder="#000000"
              maxLength={7}
              className={cn(
                inputBase,
                "h-10 font-mono",
                inputError
                  ? "border-danger focus-visible:ring-danger"
                  : "border-input",
              )}
            />
          )}
        </div>

        {/* Preset swatches */}
        {presetColors && presetColors.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {presetColors.map((color) => (
              <button
                key={color}
                type="button"
                disabled={disabled}
                onClick={() => handleSwatchClick(color)}
                className={cn(
                  "h-6 w-6 shrink-0 cursor-pointer rounded-full border-2 transition-transform hover:scale-110",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  value.toLowerCase() === color.toLowerCase()
                    ? "border-foreground"
                    : "border-transparent",
                  disabled && "cursor-not-allowed opacity-50",
                )}
                style={{ backgroundColor: color }}
                aria-label={`Select color ${color}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
);

ColorPicker.displayName = "ColorPicker";
