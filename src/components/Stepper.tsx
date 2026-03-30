import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export interface StepperStep {
  label: string;
  description?: string;
}

export interface StepperProps extends HTMLAttributes<HTMLDivElement> {
  /** Steps to display */
  steps: StepperStep[];
  /** Current step index (0-based) */
  currentStep: number;
  /** Layout orientation */
  orientation?: "horizontal" | "vertical";
}

// ── Check icon SVG ───────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg
      className="h-4 w-4"
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
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

// ── Stepper ──────────────────────────────────────────────────────────────────

export const Stepper = forwardRef<HTMLDivElement, StepperProps>(
  ({ className, steps, currentStep, orientation = "horizontal", ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";

    return (
      <div
        ref={ref}
        role="list"
        className={cn(
          "flex",
          isHorizontal ? "flex-row items-start" : "flex-col",
          className,
        )}
        {...props}
      >
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div
              key={index}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex",
                isHorizontal
                  ? "flex-1 flex-col items-center"
                  : "flex-row items-start",
              )}
            >
              <div
                className={cn(
                  "flex",
                  isHorizontal
                    ? "w-full flex-col items-center"
                    : "flex-row items-start gap-3",
                )}
              >
                {/* Step circle + connecting line row */}
                <div
                  className={cn(
                    "flex items-center",
                    isHorizontal ? "w-full" : "flex-col",
                  )}
                >
                  {/* Connecting line before (horizontal only, not first) */}
                  {isHorizontal && index > 0 && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        index <= currentStep
                          ? "bg-primary"
                          : "border-t-2 border-dashed border-muted-foreground/30 bg-transparent",
                      )}
                    />
                  )}

                  {/* Step circle */}
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      isCompleted && "bg-primary text-primary-foreground",
                      isCurrent &&
                        "border-2 border-primary bg-background text-primary",
                      isUpcoming &&
                        "border-2 border-muted-foreground/30 bg-background text-muted-foreground",
                    )}
                  >
                    {isCompleted ? <CheckIcon /> : index + 1}
                  </div>

                  {/* Connecting line after (horizontal only, not last) */}
                  {isHorizontal && !isLast && (
                    <div
                      className={cn(
                        "h-0.5 flex-1",
                        index < currentStep
                          ? "bg-primary"
                          : "border-t-2 border-dashed border-muted-foreground/30 bg-transparent",
                      )}
                    />
                  )}

                  {/* Connecting line below (vertical only, not last) */}
                  {!isHorizontal && !isLast && (
                    <div
                      className={cn(
                        "mx-auto mt-1 w-0.5 flex-1",
                        isCompleted
                          ? "bg-primary"
                          : "border-l-2 border-dashed border-muted-foreground/30 bg-transparent",
                      )}
                      style={{ minHeight: "24px" }}
                    />
                  )}
                </div>

                {/* Labels */}
                <div
                  className={cn(
                    isHorizontal ? "mt-2 text-center" : "pb-6",
                  )}
                >
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted && "text-primary",
                      isCurrent && "text-primary",
                      isUpcoming && "text-muted-foreground",
                    )}
                  >
                    {step.label}
                  </p>
                  {step.description && (
                    <p
                      className={cn(
                        "mt-0.5 text-xs",
                        isCompleted && "text-muted-foreground",
                        isCurrent && "text-muted-foreground",
                        isUpcoming && "text-muted-foreground/70",
                      )}
                    >
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);

Stepper.displayName = "Stepper";
