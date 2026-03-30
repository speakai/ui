"use client";

import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Shared styles ────────────────────────────────────────────────────────────

const inputBase = [
  "flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "transition-colors",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

// ── Chips ────────────────────────────────────────────────────────────────────

export interface ChipsProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current list of chip values */
  value: string[];
  /** Called when the list changes */
  onChange: (value: string[]) => void;
  /** Input placeholder */
  placeholder?: string;
  /** Autocomplete suggestions */
  suggestions?: string[];
  /** Maximum number of chips */
  maxItems?: number;
  disabled?: boolean;
}

export const Chips = forwardRef<HTMLDivElement, ChipsProps>(
  (
    {
      className,
      value,
      onChange,
      placeholder = "Type and press Enter",
      suggestions,
      maxItems,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const [inputValue, setInputValue] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const atLimit = maxItems !== undefined && value.length >= maxItems;

    const filteredSuggestions =
      suggestions?.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(s),
      ) ?? [];

    const addChip = useCallback(
      (chip: string) => {
        const trimmed = chip.trim();
        if (!trimmed) return;
        if (value.includes(trimmed)) return;
        if (atLimit) return;

        onChange([...value, trimmed]);
        setInputValue("");
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      },
      [value, onChange, atLimit],
    );

    const removeChip = useCallback(
      (index: number) => {
        onChange(value.filter((_, i) => i !== index));
      },
      [value, onChange],
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
          e.preventDefault();

          if (
            highlightedIndex >= 0 &&
            highlightedIndex < filteredSuggestions.length
          ) {
            addChip(filteredSuggestions[highlightedIndex]);
          } else {
            // Split on commas for pasting "a,b,c"
            const parts = inputValue.split(",");
            for (const part of parts) {
              addChip(part);
            }
          }
          return;
        }

        if (
          e.key === "Backspace" &&
          inputValue === "" &&
          value.length > 0
        ) {
          removeChip(value.length - 1);
          return;
        }

        // Arrow navigation for suggestions
        if (e.key === "ArrowDown" && filteredSuggestions.length > 0) {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
          );
          return;
        }

        if (e.key === "ArrowUp" && filteredSuggestions.length > 0) {
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
          );
          return;
        }

        if (e.key === "Escape") {
          setShowSuggestions(false);
          setHighlightedIndex(-1);
        }
      },
      [inputValue, value, addChip, removeChip, filteredSuggestions, highlightedIndex],
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value);
        setShowSuggestions(true);
        setHighlightedIndex(-1);
      },
      [],
    );

    // Close suggestions on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setShowSuggestions(false);
          setHighlightedIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div
        ref={ref}
        className={cn("relative w-full", className)}
        {...props}
      >
        <div
          ref={containerRef}
          className={cn(
            inputBase,
            "flex-wrap gap-1.5 border-input",
            disabled && "cursor-not-allowed opacity-50",
          )}
          onClick={() => inputRef.current?.focus()}
        >
          {/* Chips */}
          {value.map((chip, index) => (
            <span
              key={`${chip}-${index}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
                "transition-colors",
              )}
            >
              {chip}
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeChip(index);
                  }}
                  className="ml-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
                  aria-label={`Remove ${chip}`}
                >
                  <svg
                    className="h-2.5 w-2.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={3}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </span>
          ))}

          {/* Input */}
          {!atLimit && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              disabled={disabled}
              placeholder={value.length === 0 ? placeholder : ""}
              className="min-w-[80px] flex-1 border-none bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          )}
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions &&
          inputValue.length > 0 &&
          filteredSuggestions.length > 0 && (
            <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  className={cn(
                    "flex w-full cursor-pointer px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent",
                    index === highlightedIndex && "bg-accent",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    addChip(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
      </div>
    );
  },
);

Chips.displayName = "Chips";
