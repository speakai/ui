import {
  createContext,
  forwardRef,
  Dispatch,
  HTMLAttributes,
  KeyboardEvent,
  MutableRefObject,
  PointerEvent,
  ReactNode,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../utils/cn";

// ── DropdownMenu ─────────────────────────────────────────────────────────────

const GAP = 8;
const VIEWPORT_PADDING = 8;
const SUB_GAP = 4;
const SUB_CLOSE_DELAY_MS = 150;
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not([disabled])';

interface DropdownMenuContextValue {
  close: () => void;
  activeSubId: string | null;
  setActiveSubId: Dispatch<SetStateAction<string | null>>;
  registerLayer: (id: string, node: HTMLElement | null) => void;
}

// Lets a DropdownMenuItem close the menu it lives in when selected, matching the
// Radix menu contract callers expect. Null outside a DropdownMenu (e.g. an item
// rendered standalone), in which case selecting is a no-op for close.
const DropdownMenuContext = createContext<DropdownMenuContextValue | null>(null);

// True inside a DropdownMenuSubContent, so hovering its items does not close it.
const DropdownMenuSubLevelContext = createContext(false);

interface DropdownMenuSubContextValue {
  id: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: MutableRefObject<HTMLButtonElement | null>;
  focusFirstOnOpenRef: MutableRefObject<boolean>;
  cancelClose: () => void;
  scheduleClose: () => void;
}

const DropdownMenuSubContext = createContext<DropdownMenuSubContextValue | null>(
  null
);

function focusMenuItem(container: HTMLElement | null, index: number) {
  const items = container
    ? Array.from(container.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR))
    : [];
  if (items.length === 0) return;
  const wrapped = ((index % items.length) + items.length) % items.length;
  items[wrapped]?.focus();
}

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
    const layersRef = useRef(new Map<string, HTMLElement>());
    const [activeSubId, setActiveSubId] = useState<string | null>(null);

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

    const registerLayer = useCallback((id: string, node: HTMLElement | null) => {
      if (node) layersRef.current.set(id, node);
      else layersRef.current.delete(id);
    }, []);

    const menuContextValue = useMemo(
      () => ({
        close: () => setOpen(false),
        activeSubId,
        setActiveSubId,
        registerLayer,
      }),
      [setOpen, activeSubId, registerLayer]
    );

    const isInsideMenuLayers = useCallback((target: Node) => {
      if (menuRef.current?.contains(target)) return true;
      for (const layer of layersRef.current.values()) {
        if (layer.contains(target)) return true;
      }
      return false;
    }, []);

    useEffect(() => {
      if (!isOpen) setActiveSubId(null);
    }, [isOpen]);

    /** Returns all focusable menu items (skips disabled, headers, dividers) */
    const getMenuItems = useCallback(() => {
      if (!menuRef.current) return [];
      return Array.from(
        menuRef.current.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)
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
        if (!inWrapper && !isInsideMenuLayers(target)) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [isOpen, setOpen, isInsideMenuLayers]);

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
    // Ignores scrolls that originate inside the menu itself (e.g. a long
    // option list with overflow-y-auto), which would otherwise close the
    // menu the moment the user tried to scroll the list.
    useEffect(() => {
      if (!isOpen) return;

      const handleScroll = (e: Event) => {
        if (isInsideMenuLayers(e.target as Node)) return;
        setOpen(false);
      };
      // capture=true catches scrolls on any ancestor (tables, panels, etc.)
      window.addEventListener("scroll", handleScroll, true);
      return () => window.removeEventListener("scroll", handleScroll, true);
    }, [isOpen, setOpen, isInsideMenuLayers]);

    // Position the portaled menu relative to the trigger. Flip side when the
    // preferred side doesn't fit; clamp horizontally so the menu stays on-screen.
    useIsoLayoutEffect(() => {
      if (!isOpen || !trigger || !triggerRef.current || !menuRef.current) {
        return;
      }
      const trig = triggerRef.current.getBoundingClientRect();
      const menu = menuRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const spaceBelow = vh - trig.bottom;
      const spaceAbove = trig.top;

      let placement = side;
      if (
        side === "bottom" &&
        spaceBelow < menu.height + GAP &&
        spaceAbove > spaceBelow
      ) {
        placement = "top";
      } else if (
        side === "top" &&
        spaceAbove < menu.height + GAP &&
        spaceBelow > spaceAbove
      ) {
        placement = "bottom";
      }

      const top =
        placement === "bottom"
          ? trig.bottom + GAP
          : trig.top - menu.height - GAP;

      let left = align === "right" ? trig.right - menu.width : trig.left;
      if (left + menu.width > vw - VIEWPORT_PADDING) {
        left = vw - menu.width - VIEWPORT_PADDING;
      }
      if (left < VIEWPORT_PADDING) {
        left = VIEWPORT_PADDING;
      }

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
          <DropdownMenuContext.Provider value={menuContextValue}>
            {children}
          </DropdownMenuContext.Provider>
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
          // Cap to the actual space between menu top and viewport bottom so
          // overflow-y-auto can show a scrollbar. A static max-h-[60vh] is
          // often larger than the available space, so content fits the cap
          // but the menu still extends past the viewport edge unscrolled.
          maxHeight: coords
            ? `${window.innerHeight - coords.top - VIEWPORT_PADDING}px`
            : undefined,
          visibility: coords ? "visible" : "hidden",
        }}
        className={cn(
          "z-50 overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-md",
          "animate-scale-in",
          width
        )}
      >
        <DropdownMenuContext.Provider value={menuContextValue}>
          {children}
        </DropdownMenuContext.Provider>
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
  /**
   * Close the menu after this item runs its onClick. Defaults to true so items
   * that open a dialog or navigate leave the menu closed behind them. Set false
   * for items that toggle state in place and should keep the menu open.
   */
  closeOnSelect?: boolean;
}

export const DropdownMenuItem = forwardRef<
  HTMLButtonElement,
  DropdownMenuItemProps
>(
  (
    {
      variant = "default",
      icon,
      disabled = false,
      closeOnSelect = true,
      className,
      children,
      onClick,
      onPointerEnter,
      ...props
    },
    ref
  ) => {
    const menu = useContext(DropdownMenuContext);
    const inSubMenu = useContext(DropdownMenuSubLevelContext);
    const handlePointerEnter = useCallback(
      (e: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e);
        if (!inSubMenu) menu?.setActiveSubId(null);
      },
      [onPointerEnter, inSubMenu, menu]
    );
    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        // Respect a handler that stopped the activation (e.g. preventDefault to
        // keep a submenu open); otherwise close the menu the item lives in.
        if (closeOnSelect && !e.defaultPrevented) menu?.close();
      },
      [onClick, closeOnSelect, menu]
    );
    return (
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
        onClick={handleClick}
        onPointerEnter={handlePointerEnter}
        {...props}
      >
        {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
        {children}
      </button>
    );
  }
);
DropdownMenuItem.displayName = "DropdownMenuItem";

// ── DropdownMenuSub ──────────────────────────────────────────────────────────

export interface DropdownMenuSubProps {
  children: ReactNode;
}

export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  const menu = useContext(DropdownMenuContext);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const focusFirstOnOpenRef = useRef(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const open = menu?.activeSubId === id;
  const setActiveSubId = menu?.setActiveSubId;

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = null;
  }, []);

  const setOpen = useCallback(
    (value: boolean) => {
      cancelClose();
      setActiveSubId?.((current) =>
        value ? id : current === id ? null : current
      );
    },
    [cancelClose, setActiveSubId, id]
  );

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => setOpen(false), SUB_CLOSE_DELAY_MS);
  }, [cancelClose, setOpen]);

  useEffect(() => cancelClose, [cancelClose]);

  const value = useMemo(
    () => ({
      id,
      open,
      setOpen,
      triggerRef,
      focusFirstOnOpenRef,
      cancelClose,
      scheduleClose,
    }),
    [id, open, setOpen, cancelClose, scheduleClose]
  );

  return (
    <DropdownMenuSubContext.Provider value={value}>
      {children}
    </DropdownMenuSubContext.Provider>
  );
}

// ── DropdownMenuSubTrigger ───────────────────────────────────────────────────

export interface DropdownMenuSubTriggerProps
  extends HTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  /** Text shown before the chevron, e.g. the current value ("English"). */
  hint?: ReactNode;
  disabled?: boolean;
}

export const DropdownMenuSubTrigger = forwardRef<
  HTMLButtonElement,
  DropdownMenuSubTriggerProps
>(
  (
    {
      icon,
      hint,
      disabled = false,
      className,
      children,
      onClick,
      onKeyDown,
      onPointerEnter,
      onPointerLeave,
      ...props
    },
    ref
  ) => {
    const sub = useContext(DropdownMenuSubContext);
    const open = sub?.open ?? false;

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        if (!e.defaultPrevented) sub?.setOpen(true);
      },
      [onClick, sub]
    );

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLButtonElement>) => {
        onKeyDown?.(e);
        if (e.key === "ArrowRight" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          if (sub) {
            sub.focusFirstOnOpenRef.current = true;
            sub.setOpen(true);
          }
        }
      },
      [onKeyDown, sub]
    );

    const handlePointerEnter = useCallback(
      (e: PointerEvent<HTMLButtonElement>) => {
        onPointerEnter?.(e);
        if (e.pointerType === "mouse") sub?.setOpen(true);
      },
      [onPointerEnter, sub]
    );

    const handlePointerLeave = useCallback(
      (e: PointerEvent<HTMLButtonElement>) => {
        onPointerLeave?.(e);
        if (e.pointerType === "mouse") sub?.scheduleClose();
      },
      [onPointerLeave, sub]
    );

    return (
      <button
        ref={(node) => {
          if (sub) sub.triggerRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        type="button"
        role="menuitem"
        tabIndex={-1}
        aria-haspopup="menu"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2 px-3 py-2.5 text-start text-sm text-popover-foreground transition-colors",
          "focus:bg-muted focus:text-foreground focus:outline-hidden",
          "hover:bg-muted hover:text-foreground",
          open && "bg-muted text-foreground",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        {...props}
      >
        {icon && <span className="shrink-0" aria-hidden="true">{icon}</span>}
        <span className="min-w-0 flex-1 truncate">{children}</span>
        <span className="ms-auto flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
          {hint}
          <svg
            aria-hidden="true"
            className="h-4 w-4 rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </button>
    );
  }
);
DropdownMenuSubTrigger.displayName = "DropdownMenuSubTrigger";

// ── DropdownMenuSubContent ───────────────────────────────────────────────────

export interface DropdownMenuSubContentProps {
  children: ReactNode;
  width?: string;
  className?: string;
  /** Label of the back row shown when there is no room beside the menu and the sub-menu covers it instead (narrow screens). */
  backLabel?: string;
  "aria-label"?: string;
}

interface SubMenuLayout {
  top: number;
  left: number;
  maxHeight: number;
  overlay: boolean;
}

export function DropdownMenuSubContent({
  children,
  width = "w-48",
  className,
  backLabel = "Back",
  "aria-label": ariaLabel,
}: DropdownMenuSubContentProps) {
  const menu = useContext(DropdownMenuContext);
  const sub = useContext(DropdownMenuSubContext);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [layout, setLayout] = useState<SubMenuLayout | null>(null);
  const open = sub?.open ?? false;
  const subId = sub?.id;
  const registerLayer = menu?.registerLayer;

  const setContentNode = useCallback(
    (node: HTMLDivElement | null) => {
      contentRef.current = node;
      if (subId) registerLayer?.(subId, node);
    },
    [subId, registerLayer]
  );

  useEffect(() => {
    if (!open) setLayout(null);
  }, [open]);

  useIsoLayoutEffect(() => {
    const trigger = sub?.triggerRef.current;
    const content = contentRef.current;
    if (!open || !trigger || !content) return;

    const trig = trigger.getBoundingClientRect();
    const parent =
      trigger.closest('[role="menu"]')?.getBoundingClientRect() ?? trig;
    const rect = content.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxHeight = vh - VIEWPORT_PADDING * 2;
    const height = Math.min(rect.height, maxHeight);

    let overlay = false;
    let left = parent.right + SUB_GAP;
    if (left + rect.width > vw - VIEWPORT_PADDING) {
      left = parent.left - rect.width - SUB_GAP;
      if (left < VIEWPORT_PADDING) {
        overlay = true;
        left = Math.max(
          VIEWPORT_PADDING,
          Math.min(parent.left, vw - rect.width - VIEWPORT_PADDING)
        );
      }
    }

    let top = overlay ? parent.top : trig.top - SUB_GAP;
    if (top + height > vh - VIEWPORT_PADDING) top = vh - VIEWPORT_PADDING - height;
    if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING;

    setLayout({ top, left, maxHeight, overlay });
  }, [open, layout?.overlay]);

  const isPlaced = layout !== null;
  const isOverlay = layout?.overlay ?? false;
  const focusFirstOnOpenRef = sub?.focusFirstOnOpenRef;

  useEffect(() => {
    if (!open || !isPlaced || !focusFirstOnOpenRef?.current) return;
    const frame = requestAnimationFrame(() => {
      focusFirstOnOpenRef.current = false;
      focusMenuItem(contentRef.current, isOverlay ? 1 : 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [open, isPlaced, isOverlay, focusFirstOnOpenRef]);

  const closeToTrigger = useCallback(() => {
    sub?.setOpen(false);
    sub?.triggerRef.current?.focus();
  }, [sub]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const items = contentRef.current
        ? Array.from(
            contentRef.current.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR)
          )
        : [];
      const current = items.indexOf(document.activeElement as HTMLElement);
      switch (e.key) {
        case "ArrowDown":
          focusMenuItem(contentRef.current, current + 1);
          break;
        case "ArrowUp":
          focusMenuItem(contentRef.current, current - 1);
          break;
        case "Home":
          focusMenuItem(contentRef.current, 0);
          break;
        case "End":
          focusMenuItem(contentRef.current, items.length - 1);
          break;
        case "ArrowLeft":
        case "Escape":
          closeToTrigger();
          break;
        default:
          return;
      }
      e.preventDefault();
      e.stopPropagation();
    },
    [closeToTrigger]
  );

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={setContentNode}
      role="menu"
      aria-label={ariaLabel}
      data-dropdown-submenu=""
      data-overlay={layout?.overlay ? "" : undefined}
      onKeyDown={handleKeyDown}
      onPointerEnter={sub?.cancelClose}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") sub?.scheduleClose();
      }}
      style={{
        position: "fixed",
        top: layout?.top ?? 0,
        left: layout?.left ?? 0,
        maxHeight: layout ? `${layout.maxHeight}px` : undefined,
        visibility: layout ? "visible" : "hidden",
      }}
      className={cn(
        "z-50 overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-md",
        "animate-scale-in",
        width,
        className
      )}
    >
      {layout?.overlay && (
        <button
          type="button"
          role="menuitem"
          tabIndex={-1}
          onClick={closeToTrigger}
          className="flex w-full items-center gap-2 border-b border-border px-3 py-2.5 text-start text-sm font-medium text-popover-foreground hover:bg-muted focus:bg-muted focus:outline-hidden"
        >
          <svg
            aria-hidden="true"
            className="h-4 w-4 rtl:rotate-180"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
          </svg>
          {backLabel}
        </button>
      )}
      <DropdownMenuSubLevelContext.Provider value>
        {children}
      </DropdownMenuSubLevelContext.Provider>
    </div>,
    document.body
  );
}

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
