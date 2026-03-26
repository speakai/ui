import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type CheckboxSize = "sm" | "default" | "lg";

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  /** Label text displayed next to the checkbox */
  label?: string;
  /** Description text below the label */
  description?: string;
  size?: CheckboxSize;
  /** Error state — pass `true` for red border, or a string to show error message */
  error?: boolean | string;
}

const sizeStyles: Record<CheckboxSize, { box: string; label: string; description: string }> = {
  sm: { box: "h-3.5 w-3.5", label: "text-xs", description: "text-xs" },
  default: { box: "h-4 w-4", label: "text-sm", description: "text-xs" },
  lg: { box: "h-5 w-5", label: "text-base", description: "text-sm" },
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, size = "default", error, disabled, id, ...props }, ref) => {
    const styles = sizeStyles[size];
    const checkboxId = id ?? (label ? `checkbox-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div className={cn("inline-flex gap-2", className)}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            "shrink-0 cursor-pointer rounded border transition-colors",
            "accent-primary text-primary",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            styles.box,
            error ? "border-danger" : "border-input",
            disabled && "cursor-not-allowed opacity-50",
          )}
          {...props}
        />
        {(label || description) && (
          <div className="min-w-0">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  "cursor-pointer select-none font-medium text-foreground",
                  styles.label,
                  disabled && "cursor-not-allowed opacity-50",
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className={cn("text-muted-foreground mt-0.5", styles.description, disabled && "opacity-50")}>
                {description}
              </p>
            )}
            {typeof error === "string" && error && (
              <p className="mt-1 text-xs text-danger">{error}</p>
            )}
          </div>
        )}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";
