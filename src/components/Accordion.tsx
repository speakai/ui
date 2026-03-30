"use client";

import {
  createContext,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Context ──────────────────────────────────────────────────────────────────

type AccordionType = "single" | "multiple";

interface AccordionContextValue {
  type: AccordionType;
  openItems: Set<string>;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

function useAccordionContext() {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be used within an Accordion");
  return ctx;
}

// ── Accordion Root ───────────────────────────────────────────────────────────

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: AccordionType;
  defaultOpen?: string[];
}

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  ({ type = "single", defaultOpen = [], className, children, ...props }, ref) => {
    const [openItems, setOpenItems] = useState<Set<string>>(() => new Set(defaultOpen));

    const toggle = useCallback(
      (id: string) => {
        setOpenItems((prev) => {
          const next = new Set(prev);
          if (next.has(id)) {
            next.delete(id);
          } else {
            if (type === "single") {
              next.clear();
            }
            next.add(id);
          }
          return next;
        });
      },
      [type],
    );

    return (
      <AccordionContext.Provider value={{ type, openItems, toggle }}>
        <div
          ref={ref}
          className={cn("divide-y divide-border rounded-lg border border-border", className)}
          {...props}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  },
);
Accordion.displayName = "Accordion";

// ── AccordionItem ────────────────────────────────────────────────────────────

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  /** Unique value for this item. Auto-generated if omitted. */
  value?: string;
  defaultOpen?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ title, value, defaultOpen, disabled = false, className, children, ...props }, ref) => {
    const autoId = useId();
    const itemId = value ?? autoId;
    const contentId = `accordion-content-${itemId}`;
    const triggerId = `accordion-trigger-${itemId}`;
    const contentRef = useRef<HTMLDivElement>(null);

    const { openItems, toggle } = useAccordionContext();

    // Handle defaultOpen for individual items on first render
    const initialized = useRef(false);
    if (!initialized.current && defaultOpen && !openItems.has(itemId)) {
      openItems.add(itemId);
    }
    initialized.current = true;

    const isOpen = openItems.has(itemId);

    const handleClick = useCallback(() => {
      if (!disabled) toggle(itemId);
    }, [disabled, itemId, toggle]);

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      },
      [handleClick],
    );

    return (
      <div ref={ref} className={cn("overflow-hidden", className)} {...props}>
        <button
          id={triggerId}
          type="button"
          role="button"
          aria-expanded={isOpen}
          aria-controls={contentId}
          disabled={disabled}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            !disabled && "hover:bg-muted/50",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span>{title}</span>
          {/* Chevron */}
          <svg
            aria-hidden="true"
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-180",
            )}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div
          id={contentId}
          ref={contentRef}
          role="region"
          aria-labelledby={triggerId}
          className={cn(
            "grid transition-[grid-template-rows] duration-200 ease-out",
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div className="overflow-hidden">
            <div className="px-4 pb-3 pt-0 text-sm text-muted-foreground">{children}</div>
          </div>
        </div>
      </div>
    );
  },
);
AccordionItem.displayName = "AccordionItem";
