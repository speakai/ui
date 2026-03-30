import { forwardRef, HTMLAttributes, KeyboardEvent, useCallback } from "react";
import { cn } from "../utils/cn";

export type SwitchSize = "sm" | "default";

export interface SwitchProps extends Omit<HTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: SwitchSize;
  label?: string;
}

const trackSizes: Record<SwitchSize, string> = {
  sm: "h-6 w-10",
  default: "h-6 w-11",
};

const thumbSizes: Record<SwitchSize, string> = {
  sm: "h-4 w-4",
  default: "h-[18px] w-[18px]",
};

const thumbTranslate: Record<SwitchSize, { off: string; on: string }> = {
  sm: { off: "translate-x-0.5", on: "translate-x-5" },
  default: { off: "translate-x-0.5", on: "translate-x-[22px]" },
};

export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onChange, disabled = false, size = "default", label, className, ...props }, ref) => {
    const toggle = useCallback(() => {
      if (!disabled) onChange(!checked);
    }, [checked, disabled, onChange]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
        props.onKeyDown?.(e);
      },
      [toggle, props]
    );

    const id = props.id ?? (label ? `switch-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={cn("inline-flex items-center gap-2", className)}>
        <button
          ref={ref}
          type="button"
          role="switch"
          id={id}
          aria-checked={checked}
          aria-label={label && !props["aria-label"] ? label : props["aria-label"]}
          disabled={disabled}
          onClick={toggle}
          onKeyDown={handleKeyDown}
          className={cn(
            "relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            trackSizes[size],
            checked ? "bg-primary" : "bg-border dark:bg-foreground/25",
            disabled && "cursor-not-allowed opacity-50"
          )}
          {...props}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block rounded-full bg-background shadow-xs ring-0 transition-transform duration-200",
              thumbSizes[size],
              checked ? thumbTranslate[size].on : thumbTranslate[size].off
            )}
          />
        </button>
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "cursor-pointer select-none text-sm text-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);
Switch.displayName = "Switch";
