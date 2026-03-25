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
  trigger: ReactNode;
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

    const setOpen = useCallback(
      (value: boolean) => {
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

    // Focus first menu item on open
    useEffect(() => {
      if (!isOpen) return;

      const frame = requestAnimationFrame(() => {
        const firstItem = menuRef.current?.querySelector<HTMLElement>(
          '[role="menuitem"]:not([disabled])'
        );
        firstItem?.focus();
      });

      return () => cancelAnimationFrame(frame);
    }, [isOpen]);

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

    // Keyboard navigation
    const handleMenuKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        const menu = menuRef.current;
        if (!menu) return;

        const items = Array.from(
          menu.querySelectorAll<HTMLElement>(
            '[role="menuitem"]:not([disabled])'
          )
        );
        const currentIndex = items.indexOf(
          document.activeElement as HTMLElement
        );

        switch (e.key) {
          case "ArrowDown": {
            e.preventDefault();
            const nextIndex =
              currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            items[nextIndex]?.focus();
            break;
          }
          case "ArrowUp": {
            e.preventDefault();
            const prevIndex =
              currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            items[prevIndex]?.focus();
            break;
          }
          case "Escape": {
            e.preventDefault();
            setOpen(false);
            triggerRef.current?.focus();
            break;
          }
          case "Tab": {
            setOpen(false);
            break;
          }
        }
      },
      [setOpen]
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

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        className={cn("relative inline-block", className)}
      >
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="true"
          aria-expanded={isOpen}
          onClick={toggle}
          onKeyDown={handleTriggerKeyDown}
          className="inline-flex"
        >
          {trigger}
        </button>

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
      "focus:bg-accent focus:text-accent-foreground focus:outline-none",
      variant === "danger"
        ? "text-destructive focus:bg-destructive/10 focus:text-destructive"
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
