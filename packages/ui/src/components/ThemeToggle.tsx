"use client";

import { forwardRef, HTMLAttributes, useEffect, useState } from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

type Theme = "light" | "dark" | "system";

export interface ThemeToggleProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onChange"> {
  theme?: Theme;
  onChange?: (theme: Theme) => void;
}

export interface ThemeSelectorProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  theme?: Theme;
  onChange?: (theme: Theme) => void;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const SunIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
  </svg>
);

const MoonIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
  </svg>
);

const SystemIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" />
  </svg>
);

// ── ThemeToggle (icon button, cycles through themes) ─────────────────────────

export const ThemeToggle = forwardRef<HTMLButtonElement, ThemeToggleProps>(
  ({ theme: controlledTheme, onChange, className, ...props }, ref) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="h-9 w-9" />;

    const next: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };
    const currentTheme = controlledTheme || "system";

    return (
      <button
        ref={ref}
        onClick={() => onChange?.(next[currentTheme])}
        aria-label={`Switch to ${next[currentTheme]} theme`}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
          "text-muted-foreground hover:bg-muted hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
        {...props}
      >
        {currentTheme === "light" && <SunIcon />}
        {currentTheme === "dark" && <MoonIcon />}
        {currentTheme === "system" && <SystemIcon />}
      </button>
    );
  }
);
ThemeToggle.displayName = "ThemeToggle";

// ── ThemeSelector (segmented control) ────────────────────────────────────────

const themes: { value: Theme; icon: typeof SunIcon; label: string }[] = [
  { value: "light", icon: SunIcon, label: "Light" },
  { value: "dark", icon: MoonIcon, label: "Dark" },
  { value: "system", icon: SystemIcon, label: "System" },
];

export const ThemeSelector = forwardRef<HTMLDivElement, ThemeSelectorProps>(
  ({ theme: controlledTheme, onChange, className, ...props }, ref) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted) return <div className="h-9 w-28" />;

    const currentTheme = controlledTheme || "system";

    return (
      <div
        ref={ref}
        className={cn("inline-flex rounded-lg border border-border bg-muted/50 p-0.5", className)}
        role="radiogroup"
        aria-label="Theme"
        {...props}
      >
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            role="radio"
            aria-checked={currentTheme === value}
            aria-label={label}
            onClick={() => onChange?.(value)}
            className={cn(
              "inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              currentTheme === value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }
);
ThemeSelector.displayName = "ThemeSelector";
