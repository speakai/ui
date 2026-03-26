"use client";

import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";
import { Dialog, DialogBody, DialogFooter } from "./Dialog";
import { Button } from "./Button";

// ── Types ────────────────────────────────────────────────────────────────────

export type ConfirmDialogVariant = "danger" | "warning" | "info";

export interface ConfirmDialogProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Whether the dialog is visible. Alias: `isOpen` */
  open?: boolean;
  /** @deprecated Use `open` instead */
  isOpen?: boolean;
  /** Called when the dialog should close. Alias: `onCancel` */
  onClose?: () => void;
  /** @deprecated Use `onClose` instead */
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  /** Body text. Alias: `message` */
  description?: string;
  /** @deprecated Use `description` instead */
  message?: string;
  /** Confirm button label. Alias: `confirmText` */
  confirmLabel?: string;
  /** @deprecated Use `confirmLabel` instead */
  confirmText?: string;
  /** Cancel button label. Alias: `cancelText` */
  cancelLabel?: string;
  /** @deprecated Use `cancelLabel` instead */
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  icon?: ReactNode;
}

// ── Icons ────────────────────────────────────────────────────────────────────

const defaultIcons: Record<ConfirmDialogVariant, ReactNode> = {
  danger: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  ),
  warning: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </svg>
  ),
  info: (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  ),
};

const variantStyles: Record<ConfirmDialogVariant, { icon: string; button: "danger" | "primary" | "outline" }> = {
  danger: { icon: "bg-danger/10 text-danger", button: "danger" },
  warning: { icon: "bg-warning/10 text-warning", button: "primary" },
  info: { icon: "bg-info/10 text-info", button: "primary" },
};

// ── Component ────────────────────────────────────────────────────────────────

export const ConfirmDialog = forwardRef<HTMLDivElement, ConfirmDialogProps>(
  (
    {
      open: openProp,
      isOpen,
      onClose: onCloseProp,
      onCancel,
      onConfirm,
      title,
      description: descriptionProp,
      message,
      confirmLabel: confirmLabelProp,
      confirmText,
      cancelLabel: cancelLabelProp,
      cancelText,
      variant = "danger",
      isLoading = false,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    // Resolve aliased props (prefer canonical names)
    const open = openProp ?? isOpen ?? false;
    const onClose = onCloseProp ?? onCancel ?? (() => {});
    const description = descriptionProp ?? message;
    const confirmLabel = confirmLabelProp ?? confirmText ?? "Confirm";
    const cancelLabel = cancelLabelProp ?? cancelText ?? "Cancel";
    const styles = variantStyles[variant];

    return (
      <Dialog ref={ref} open={open} onClose={onClose} size="sm" className={className} {...props}>
        <DialogBody>
          <div className="flex gap-4">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", styles.icon)}>
              {icon || defaultIcons[variant]}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-foreground">{title}</h3>
              {description && (
                <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={styles.button} size="sm" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </Dialog>
    );
  }
);
ConfirmDialog.displayName = "ConfirmDialog";
