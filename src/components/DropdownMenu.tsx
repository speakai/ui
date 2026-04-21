import {
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

// ── DropdownMenu ─────────────────────────────────────────────────────────────

export interface DropdownMenuProps {
  /** Trigger element — when provided, DropdownMenu manages open/close internally. When omitted, use the `open` prop to control visibility externally. */
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "left" | "right";
  /** Which side to open the menu on — "bottom" (default) opens below the trigger, "top" opens above. */
  side?: "bottom" | "top";
  width?: string;
  children: ReactNode;
  className?: string;
}

const GAP = 8;

// useLayoutEffect warns in SSR — noop on the server.
const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

export const DropdownMenu = forwardRef<HTMLDivElement, DropdownMenuProps>(
  (
    {
      trigger,
      open: controlledOpen,
      onOpenChange,
      align = "right",
      side = "bottom",
      width = "w-48",
      children,
      className,
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const focusIndexRef = useRef(-1);

    const [coords, setCoords] = useState<{ top: number; left: number } | null>(
      null
    );

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

    // Click outside to close — portal menu is outside wrapperRef, so check both.
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        const inWrapper = wrapperRef.current?.contains(target);
        const inMenu = menuRef.current?.contains(target);
        if (!inWrapper && !inMenu) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, setOpen]);

    // Close on Escape
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

    // Close on scroll — avoids the menu drifting away from the trigger.
    useEffect(() => {
      if (!isOpen) return;

      const handleScroll = () => setOpen(false);
      // capture=true catches scrolls on any ancestor (tables, panels, etc.)
      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }, [isOpen, setOpen]);

    // Position the portaled menu relative to the trigger.
    useIsoLayoutEffect(() => {
      if (!isOpen || !trigger || !triggerRef.current || !menuRef.current) {
        return;
      }
      const trig = triggerRef.current.getBoundingClientRect();
      const menu = menuRef.current.getBoundingClientRect();

      const top =
        side === "bottom"
          ? trig.bottom + GAP
          : trig.top - menu.height - GAP;
      const left =
        align === "right" ? trig.right - menu.width : trig.left;

      setCoords({ top, left });
    }, [isOpen, side, align, trigger]);

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
            setOpen(false);
            break;
          }
        }
      },
      [setOpen, getMenuItems, focusItem]
    );

    const handleTriggerKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      },
      [setOpen]
    );

    // Triggerless mode — legacy path where the caller positions the menu.
    if (!trigger) {
      if (!isOpen) return null;
      return (
        <div
          ref={(node) => {
            (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            "absolute z-50 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-md",
            "animate-scale-in",
            side === "top" ? "bottom-full mb-2" : "mt-2",
            align === "right" ? "right-0" : "left-0",
            width,
            className
          )}
        >
          {children}
        </div>
      );
    }

    const menuNode = isOpen ? (
      <div
        ref={menuRef}
        role="menu"
        onKeyDown={handleMenuKeyDown}
        data-align={align}
        data-side={side}
        style={{
          position: "fixed",
          top: coords?.top ?? 0,
          left: coords?.left ?? 0,
          visibility: coords ? "visible" : "hidden",
        }}
        className={cn(
          "z-50 max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-md",
          "animate-scale-in",
          width
        )}
      >
        {children}
      </div>
    ) : null;

    return (
      <>
        <div
          ref={(node) => {
            (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") ref(node);
            else if (ref) ref.current = node;
          }}
          className={cn("relative inline-block", className)}
        >
          <div
            ref={triggerRef}
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-expanded={isOpen}
            onClick={toggle}
            onKeyDown={handleTriggerKeyDown}
            className="inline-flex cursor-pointer"
          >
            {trigger}
          </div>
        </div>
        {menuNode && typeof document !== "undefined"
          ? createPortal(menuNode, document.body)
          : null}
      </>
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
      "focus:bg-muted focus:text-foreground focus:outline-hidden",
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
    {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
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
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
