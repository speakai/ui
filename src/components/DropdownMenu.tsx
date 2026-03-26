import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── DropdownMenu ─────────────────────────────────────────────────────────────

export interface DropdownMenuProps {
  /** Trigger element — when provided, DropdownMenu manages open/close internally. When omitted, use the `open` prop to control visibility externally. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "left" | "right";
  width?: string;
  children: ReactNode;
  className?: string;
}

export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      trigger,
      open: controlledOpen,
      onOpenChange,
      align = "right",
      width = "w-48",
      children,
      className,
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const focusIndexRef = useRef(-1);

    const setOpen = useCallback(
      (value: boolean) => {
        if (!value) {
          focusIndexRef.current = -1;
        }
        if (isControlled) {
          onOpenChange?.(value);
        } else {
          setInternalOpen(value);
        }
      },
      [isControlled, onOpenChange]
    );

    const toggle = useCallback(() => {
      setOpen(!isOpen);
    }, [isOpen, setOpen]);

    /** Returns all focusable menu items (skips disabled, headers, dividers) */
    const getMenuItems = useCallback(() => {
      if (!menuRef.current) return [];
      return Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(
          '[role="menuitem"]:not([disabled])'
        )
      );
    }, []);

    /** Focus a menu item by index with wrapping */
    const focusItem = useCallback(
      (index: number) => {
        const items = getMenuItems();
        if (items.length === 0) return;

        // Wrap around
        const wrapped = ((index % items.length) + items.length) % items.length;
        focusIndexRef.current = wrapped;
        items[wrapped]?.focus();
      },
      [getMenuItems]
    );

    // Focus first menu item on open
    useEffect(() => {
      if (!isOpen) return;

      const frame = requestAnimationFrame(() => {
        focusItem(0);
      });

      return () => cancelAnimationFrame(frame);
    }, [isOpen, focusItem]);

    // Click outside to close
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, setOpen]);

    // Close on Escape via document listener (catches Escape even when focus is outside menu)
    useEffect(() => {
      if (!isOpen) return;

      const handleEscape = (e: globalThis.KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen, setOpen]);

    // Keyboard navigation within the menu
    const handleMenuKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        const items = getMenuItems();
        if (items.length === 0) return;

        const currentIndex = items.indexOf(
          document.activeElement as HTMLElement
        );

        switch (e.key) {
          case "ArrowDown": {
            e.preventDefault();
            focusItem(currentIndex + 1);
            break;
          }
          case "ArrowUp": {
            e.preventDefault();
            focusItem(currentIndex - 1);
            break;
          }
          case "Home": {
            e.preventDefault();
            focusItem(0);
            break;
          }
          case "End": {
            e.preventDefault();
            focusItem(items.length - 1);
            break;
          }
          case "Tab": {
            // Tab closes the menu and moves focus naturally
            setOpen(false);
            break;
          }
          // Escape is handled by the document-level listener
        }
      },
      [setOpen, getMenuItems, focusItem]
    );

    const handleTriggerKeyDown = useCallback(
      (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      },
      [setOpen]
    );

    // Triggerless mode — just render the positioned menu when open
    if (!trigger) {
      if (!isOpen) return null;
      return (
        <div
          ref={(node) => {
            (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute z-50 mt-2 rounded-lg border border-border bg-popover py-1 shadow-md",
            "animate-scale-in",
            align === "right" ? "right-0" : "left-0",
            width,
            className
          )}
        >
          {children}
        </div>
      );
    }

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("relative inline-block", className)}
      >
        <div
          ref={triggerRef as unknown as React.RefObject<HTMLDivElement>}
          role="button"
          tabIndex={0}
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown as unknown as React.KeyboardEventHandler<HTMLDivElement>}
          className="inline-flex cursor-pointer"
        >
          {trigger}
        </div>

        {isOpen && (
          <div
            ref={menuRef}
            role="menu"
            onKeyDown={handleMenuKeyDown}
            className={cn(
              "absolute z-50 mt-2 rounded-lg border border-border bg-popover py-1 shadow-md",
              "animate-scale-in",
              align === "right" ? "right-0" : "left-0",
              width
            )}
          >
            {children}
          </div>
        )}
      </div>
    );
  }
);
DropdownMenu.displayName = "DropdownMenu";

// ── DropdownMenuItem ─────────────────────────────────────────────────────────

export interface DropdownMenuItemProps
  extends HTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "danger";
  icon?: ReactNode;
  disabled?: boolean;
}

export const DropdownMenuItem = forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(({ variant = "default", icon, disabled = false, className, children, ...props }, ref) => (
  <button
    ref={ref}
    role="menuitem"
    tabIndex={-1}
    className={cn(
      "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors",
      "focus:bg-muted focus:text-foreground focus:outline-none",
      "hover:bg-muted hover:text-foreground",
      variant === "danger"
        ? "text-danger hover:bg-danger/10 hover:text-danger focus:bg-danger/10 focus:text-danger"
        : "text-popover-foreground",
      disabled && "pointer-events-none opacity-50",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
    {children}
  </button>
));
DropdownMenuItem.displayName = "DropdownMenuItem";

// ── DropdownMenuHeader ───────────────────────────────────────────────────────

export interface DropdownMenuHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenuHeader = forwardRef<
  HTMLDivElement,
  DropdownMenuHeaderProps
>(({ children, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      className
    )}
  >
    {children}
  </div>
));
DropdownMenuHeader.displayName = "DropdownMenuHeader";

// ── DropdownMenuDivider ──────────────────────────────────────────────────────

export const DropdownMenuDivider = forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => (
  <div
    ref={ref}
    role="separator"
    className={cn("my-1 border-t border-border", className)}
  />
));
DropdownMenuDivider.displayName = "DropdownMenuDivider";

// ── MoreButton ───────────────────────────────────────────────────────────────

export interface MoreButtonProps extends HTMLAttributes<HTMLButtonElement> {}

export const MoreButton = forwardRef<HTMLButtonElement, MoreButtonProps>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label="More options"
      className={cn(
        "inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        className="h-5 w-5"
        xmlns="http://www.w3.org/2000/svg"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="5" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="12" cy="19" r="2" />
      </svg>
    </button>
  )
);
MoreButton.displayName = "MoreButton";
