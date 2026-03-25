"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const icons: Record<ToastType, ReactNode> = {
  success: (
    <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
};

const typeStyles: Record<ToastType, string> = {
  success: "border-green-200 dark:border-green-800",
  error: "border-red-200 dark:border-red-800",
  info: "border-blue-200 dark:border-blue-800",
  warning: "border-yellow-200 dark:border-yellow-800",
};

// ── Toast Item ─────────────────────────────────────────────────────────────────

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem = ({ toast, onDismiss }: ToastItemProps) => {
  const duration = toast.type === "warning" ? 12000 : 5000;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(toast.id), duration);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, duration, onDismiss]);

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-4 shadow-lg transition-all duration-200 dark:bg-gray-800",
        typeStyles[toast.type]
      )}
    >
      <div className="flex-shrink-0 pt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{toast.title}</p>
        {toast.message && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{toast.message}</p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200 dark:hover:bg-gray-700 dark:hover:text-gray-300"
      >
        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// ── Container ──────────────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  className?: string;
}

export const ToastContainer = ({ toasts, onDismiss, className }: ToastContainerProps) => (
  <div
    className={cn(
      "pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end gap-3 p-4 sm:p-6",
      className
    )}
  >
    {toasts.map((toast) => (
      <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
    ))}
  </div>
);
ToastContainer.displayName = "ToastContainer";

// ── Context ────────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let idCounter = 0;

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${++idCounter}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};
ToastProvider.displayName = "ToastProvider";

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return {
    ...ctx,
    success: (title: string, message?: string) =>
      ctx.addToast({ type: "success", title, message }),
    error: (title: string, message?: string) =>
      ctx.addToast({ type: "error", title, message }),
    info: (title: string, message?: string) =>
      ctx.addToast({ type: "info", title, message }),
    warning: (title: string, message?: string) =>
      ctx.addToast({ type: "warning", title, message }),
  };
}
