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

// ── Country data ─────────────────────────────────────────────────────────────

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const COUNTRIES: Country[] = [
  { code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", flag: "🇬🇧" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "AU", name: "Australia", dialCode: "+61", flag: "🇦🇺" },
  { code: "DE", name: "Germany", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "IN", name: "India", dialCode: "+91", flag: "🇮🇳" },
  { code: "JP", name: "Japan", dialCode: "+81", flag: "🇯🇵" },
  { code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
];

// ── Types ────────────────────────────────────────────────────────────────────

export interface PhoneInputProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Full phone value including country code (e.g. "+1 555-1234") */
  value: string;
  /** Called with the full phone string */
  onChange: (value: string) => void;
  /** Default country code (ISO 3166-1 alpha-2) */
  defaultCountry?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Pass `true` for red border only, or a string to show an error message below. */
  error?: boolean | string;
  /** Label displayed above the input */
  label?: string;
}

// ── PhoneInput ───────────────────────────────────────────────────────────────

export const PhoneInput = forwardRef<HTMLDivElement, PhoneInputProps>(
  (
    {
      className,
      value,
      onChange,
      defaultCountry = "US",
      placeholder = "Phone number",
      disabled = false,
      error,
      label,
      ...props
    },
    ref,
  ) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(
      () =>
        COUNTRIES.find((c) => c.code === defaultCountry) ?? COUNTRIES[0],
    );
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Extract phone number without dial code
    const phoneNumber = useMemo(() => {
      if (!value) return "";
      // Strip the dial code prefix if present
      const dialCode = selectedCountry.dialCode;
      if (value.startsWith(dialCode)) {
        return value.slice(dialCode.length).trimStart();
      }
      return value;
    }, [value, selectedCountry]);

    const handlePhoneChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const num = e.target.value;
        onChange(num ? `${selectedCountry.dialCode} ${num}` : "");
      },
      [onChange, selectedCountry],
    );

    const handleCountrySelect = useCallback(
      (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        // Update value with new dial code
        if (phoneNumber) {
          onChange(`${country.dialCode} ${phoneNumber}`);
        }
      },
      [onChange, phoneNumber],
    );

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
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
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen]);

    return (
      <div ref={ref} className={cn("relative w-full", className)} {...props}>
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}

        <div ref={containerRef} className="relative flex">
          {/* Country selector */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-l-lg border border-r-0 bg-background px-2.5 py-2 text-sm transition-colors",
              error ? "border-danger" : "border-input",
              disabled
                ? "cursor-not-allowed opacity-50"
                : "cursor-pointer hover:bg-muted/50",
            )}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="text-base leading-none">{selectedCountry.flag}</span>
            <span className="text-muted-foreground">
              {selectedCountry.dialCode}
            </span>
            <svg
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
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
          </button>

          {/* Phone number input */}
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            className={cn(
              inputBase,
              "h-10 rounded-l-none border-l-0",
              error ? errorRing : defaultRing,
            )}
          />

          {/* Country dropdown */}
          {isOpen && (
            <div
              className="absolute left-0 z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md"
              style={{ top: "100%" }}
              role="listbox"
            >
              <div className="max-h-60 overflow-y-auto">
                {COUNTRIES.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    role="option"
                    aria-selected={country.code === selectedCountry.code}
                    className={cn(
                      "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-popover-foreground transition-colors hover:bg-accent",
                      country.code === selectedCountry.code &&
                        "bg-accent font-medium",
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCountrySelect(country);
                    }}
                  >
                    <span className="text-base leading-none">
                      {country.flag}
                    </span>
                    <span className="flex-1">{country.name}</span>
                    <span className="text-muted-foreground">
                      {country.dialCode}
                    </span>
                  </button>
                ))}
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

PhoneInput.displayName = "PhoneInput";
