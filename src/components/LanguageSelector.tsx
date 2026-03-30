"use client";

import {
  forwardRef,
  HTMLAttributes,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Shared styles (matching Input.tsx) ───────────────────────────────────────

const inputBase = [
  "flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "transition-colors",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const errorRing = "border-danger focus-visible:ring-danger";
const defaultRing = "border-input";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Language {
  code: string;
  name: string;
}

export interface LanguageSelectorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Currently selected language code */
  value: string;
  /** Called when a language is selected */
  onChange: (code: string) => void;
  /** Available languages */
  languages: Language[];
  /** Placeholder text when no language is selected */
  placeholder?: string;
  /** Show search/filter input in dropdown */
  searchable?: boolean;
  disabled?: boolean;
  /** Pass `true` for red border only, or a string to show an error message below. */
  error?: boolean | string;
  /** Label displayed above the selector */
  label?: string;
}

// ── LanguageSelector ─────────────────────────────────────────────────────────

export const LanguageSelector = forwardRef<HTMLDivElement, LanguageSelectorProps>(
  (
    {
      className,
      value,
      onChange,
      languages,
      placeholder = "Select language",
      searchable = true,
      disabled = false,
      error,
      label,
      ...props
    },
    ref,
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const selectedLanguage = useMemo(
      () => languages.find((l) => l.code === value),
      [languages, value],
    );

    const filteredLanguages = useMemo(() => {
      if (!search) return languages;
      const lower = search.toLowerCase();
      return languages.filter(
        (l) =>
          l.name.toLowerCase().includes(lower) ||
          l.code.toLowerCase().includes(lower),
      );
    }, [languages, search]);

    const handleToggle = useCallback(() => {
      if (disabled) return;
      setIsOpen((prev) => {
        if (!prev) {
          setSearch("");
        }
        return !prev;
      });
    }, [disabled]);

    const handleSelect = useCallback(
      (code: string) => {
        onChange(code);
        setIsOpen(false);
        setSearch("");
      },
      [onChange],
    );

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
          setSearch("");
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Close on Escape
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setIsOpen(false);
          setSearch("");
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    // Focus search input when dropdown opens
    useEffect(() => {
      if (isOpen && searchable) {
        // Delay to allow the dropdown to render
        requestAnimationFrame(() => {
          searchInputRef.current?.focus();
        });
      }
    }, [isOpen, searchable]);

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative">
          {/* Trigger */}
          <button
            type="button"
            disabled={disabled}
            onClick={handleToggle}
            className={cn(
              inputBase,
              "h-10 cursor-pointer items-center justify-between pr-10 text-left",
              error ? errorRing : defaultRing,
              disabled && "cursor-not-allowed",
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span
              className={cn(
                !selectedLanguage && "text-muted-foreground",
              )}
            >
              {selectedLanguage ? selectedLanguage.name : placeholder}
            </span>
          </button>

          {/* Chevron */}
          <svg
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-transform duration-200",
              label && "top-[calc(50%+12px)]",
              isOpen && "rotate-180",
            )}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>

          {/* Dropdown */}
          {isOpen && (
            <div
              className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md"
              role="listbox"
            >
              {/* Search input */}
              {searchable && (
                <div className="border-b border-border p-2">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search languages..."
                    className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              )}

              {/* Language list */}
              <div className="max-h-60 overflow-y-auto">
                {filteredLanguages.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No languages found
                  </div>
                ) : (
                  filteredLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      role="option"
                      aria-selected={lang.code === value}
                      className={cn(
                        "flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent",
                        lang.code === value && "bg-accent font-medium",
                      )}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(lang.code);
                      }}
                    >
                      {lang.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {typeof error === "string" && error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  },
);

LanguageSelector.displayName = "LanguageSelector";
