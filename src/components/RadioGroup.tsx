"use client";

import { forwardRef, HTMLAttributes, KeyboardEvent, useCallback, useId } from "react";
import { cn } from "../utils/cn";

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export type RadioGroupOrientation = "horizontal" | "vertical";
export type RadioGroupVariant = "default" | "card";

export interface RadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  orientation?: RadioGroupOrientation;
  variant?: RadioGroupVariant;
  name?: string;
  disabled?: boolean;
}

const orientationStyles: Record<RadioGroupOrientation, string> = {
  horizontal: "flex-row flex-wrap gap-4",
  vertical: "flex-col gap-2",
};

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      value,
      onChange,
      options,
      orientation = "vertical",
      variant = "default",
      name,
      disabled = false,
      className,
      ...props
    },
    ref,
  ) => {
    const groupId = useId();
    const radioName = name ?? `radio-group-${groupId}`;

    const enabledOptions = options.filter((o) => !o.disabled && !disabled);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (enabledOptions.length === 0) return;

        const currentIndex = enabledOptions.findIndex((o) => o.value === value);
        let nextIndex: number | null = null;

        switch (e.key) {
          case "ArrowDown":
          case "ArrowRight":
            nextIndex = (currentIndex + 1) % enabledOptions.length;
            break;
          case "ArrowUp":
          case "ArrowLeft":
            nextIndex = (currentIndex - 1 + enabledOptions.length) % enabledOptions.length;
            break;
          case " ": {
            e.preventDefault();
            const focused = document.activeElement as HTMLElement | null;
            const focusedValue = focused?.getAttribute("data-value");
            if (focusedValue) {
              onChange(focusedValue);
            }
            return;
          }
          default:
            return;
        }

        e.preventDefault();
        const nextOption = enabledOptions[nextIndex];
        onChange(nextOption.value);

        // Focus the next radio button
        const container = e.currentTarget;
        const nextEl = container.querySelector<HTMLElement>(
          `[data-value="${nextOption.value}"]`,
        );
        nextEl?.focus();
      },
      [enabledOptions, value, onChange],
    );

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
        className={cn("flex", orientationStyles[orientation], className)}
        {...props}
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          const isDisabled = disabled || !!option.disabled;
          const optionId = `${radioName}-${option.value}`;

          const isCard = variant === "card";

          return (
            <label
              key={option.value}
              htmlFor={optionId}
              className={cn(
                "group flex cursor-pointer items-start gap-3",
                isCard && "rounded-lg border p-3 transition-colors",
                isCard && isSelected && "border-primary bg-primary/5",
                isCard && !isSelected && "border-border hover:border-border/80",
                isDisabled && "cursor-not-allowed opacity-50",
              )}
            >
              <div
                id={optionId}
                role="radio"
                aria-checked={isSelected}
                aria-disabled={isDisabled}
                tabIndex={isSelected || (!value && option === enabledOptions[0]) ? 0 : -1}
                data-value={option.value}
                onClick={() => {
                  if (!isDisabled) onChange(option.value);
                }}
                className={cn(
                  "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-border bg-transparent group-hover:border-primary/50",
                  isDisabled && "pointer-events-none",
                )}
              >
                {isSelected && (
                  <span className="h-2 w-2 rounded-full bg-background" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    );
  },
);
RadioGroup.displayName = "RadioGroup";
