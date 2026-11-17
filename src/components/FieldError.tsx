import { forwardRef, HTMLAttributes, useId } from "react";
import { cn } from "../utils/cn";

export interface FieldErrorProps extends HTMLAttributes<HTMLParagraphElement> {
  /** Id the form control points at with `aria-describedby`. */
  id?: string;
}

// danger-text (not danger) so small error text meets 4.5:1 in light and dark mode.
export const FieldError = forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, children, ...props }, ref) => {
    if (children === null || children === undefined || children === false || children === "") {
      return null;
    }
    return (
      <p
        ref={ref}
        className={cn("mt-1.5 text-xs text-danger-text", className)}
        {...props}
      >
        {children}
      </p>
    );
  },
);

FieldError.displayName = "FieldError";

// Consumer ids come first so their own description is read before the error.
export function useFieldError(
  error: boolean | string | null | undefined,
  describedBy?: string,
) {
  const errorId = useId();
  const errorMessage = typeof error === "string" && error ? error : null;
  const ariaDescribedBy =
    [describedBy, errorMessage ? errorId : null].filter(Boolean).join(" ") || undefined;
  return { errorId, errorMessage, ariaDescribedBy };
}
