import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "../utils/cn";

// ── DropdownMenu ───────────────────────────────────────────────────────────────

export interface DropdownMenuProps {
  trigger: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "left" | "right";
  width?: string;
  children: ReactNode;
  className?: string;
}

export const DropdownMenu = ({
  trigger,
  open: controlledOpen,
  onOpenChange,
  align = "right",
  width = "w-48",
  children,
  className,
}: DropdownMenuProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const containerRef = useRef<HTMLDivElement>(null);

  const setOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalOpen(value);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div
          className={cn(
            "absolute z-50 mt-2 rounded-xl border border-gray-200 bg-white py-1 shadow-lg transition-all duration-200 dark:border-gray-700 dark:bg-gray-800",
            align === "right" ? "right-0" : "left-0",
            width
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
};
DropdownMenu.displayName = "DropdownMenu";

// ── DropdownMenuItem ───────────────────────────────────────────────────────────

export interface DropdownMenuItemProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "danger";
  icon?: ReactNode;
  disabled?: boolean;
}

export const DropdownMenuItem = ({
  variant = "default",
  icon,
  disabled = false,
  className,
  children,
  ...props
}: DropdownMenuItemProps) => (
  <button
    className={cn(
      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-all duration-200",
      variant === "danger"
        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700",
      disabled && "cursor-not-allowed opacity-50",
      className
    )}
    disabled={disabled}
    {...props}
  >
    {icon && <span className="flex-shrink-0">{icon}</span>}
    {children}
  </button>
);
DropdownMenuItem.displayName = "DropdownMenuItem";

// ── DropdownMenuHeader ─────────────────────────────────────────────────────────

export interface DropdownMenuHeaderProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenuHeader = ({ children, className }: DropdownMenuHeaderProps) => (
  <div
    className={cn(
      "px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400",
      className
    )}
  >
    {children}
  </div>
);
DropdownMenuHeader.displayName = "DropdownMenuHeader";

// ── DropdownMenuDivider ────────────────────────────────────────────────────────

export const DropdownMenuDivider = ({ className }: { className?: string }) => (
  <div className={cn("my-1 border-t border-gray-200 dark:border-gray-700", className)} />
);
DropdownMenuDivider.displayName = "DropdownMenuDivider";

// ── MoreButton ─────────────────────────────────────────────────────────────────

export interface MoreButtonProps extends HTMLAttributes<HTMLButtonElement> {}

export const MoreButton = ({ className, ...props }: MoreButtonProps) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 dark:hover:bg-gray-700 dark:hover:text-gray-300",
      className
    )}
    {...props}
  >
    <svg
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
);
MoreButton.displayName = "MoreButton";
