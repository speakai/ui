"use client";

import {
  forwardRef,
  HTMLAttributes,
  useCallback,
  useRef,
  useState,
  DragEvent,
} from "react";
import { cn } from "../utils/cn";

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Variant styles ───────────────────────────────────────────────────────────

export type ImageUploaderVariant = "dropzone" | "avatar";

const variantStyles: Record<ImageUploaderVariant, string> = {
  dropzone:
    "w-full min-h-[160px] rounded-lg border-2 border-dashed border-border",
  avatar:
    "h-24 w-24 rounded-full border-2 border-dashed border-border overflow-hidden",
};

const variantDragStyles: Record<ImageUploaderVariant, string> = {
  dropzone: "border-primary bg-primary/5",
  avatar: "border-primary bg-primary/5",
};

// ── ImageUploader ────────────────────────────────────────────────────────────

export interface ImageUploaderProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Current image URL for preview */
  value?: string;
  /** Called when a file is selected */
  onChange: (file: File) => void;
  /** Called when the user clicks remove */
  onRemove?: () => void;
  /** Accepted file types (default "image/*") */
  accept?: string;
  /** Max file size in bytes (default 10 MB) */
  maxSize?: number;
  /** Placeholder text */
  placeholder?: string;
  disabled?: boolean;
  /** Display variant */
  variant?: ImageUploaderVariant;
}

export const ImageUploader = forwardRef<HTMLDivElement, ImageUploaderProps>(
  (
    {
      className,
      value,
      onChange,
      onRemove,
      accept = "image/*",
      maxSize = DEFAULT_MAX_SIZE,
      placeholder = "Drop an image here or click to browse",
      disabled = false,
      variant = "dropzone",
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const displayImage = value || preview;

    const validateAndEmit = useCallback(
      (file: File) => {
        setError(null);

        if (maxSize && file.size > maxSize) {
          const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
          setError(`File exceeds ${sizeMB} MB limit`);
          return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        onChange(file);
      },
      [maxSize, onChange],
    );

    const handleDragOver = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      },
      [disabled],
    );

    const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        const file = e.dataTransfer.files[0];
        if (file) validateAndEmit(file);
      },
      [disabled, validateAndEmit],
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) validateAndEmit(file);
        // Reset so the same file can be selected again
        e.target.value = "";
      },
      [validateAndEmit],
    );

    const handleRemove = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setPreview(null);
        setError(null);
        onRemove?.();
      },
      [onRemove],
    );

    const handleClick = useCallback(() => {
      if (!disabled) inputRef.current?.click();
    }, [disabled]);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={handleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleClick();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative flex cursor-pointer items-center justify-center transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            variantStyles[variant],
            isDragging && variantDragStyles[variant],
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          {displayImage ? (
            <>
              <img
                src={displayImage}
                alt="Preview"
                className={cn(
                  "object-cover",
                  variant === "avatar"
                    ? "h-full w-full"
                    : "max-h-48 rounded-md",
                )}
              />

              {/* Remove button */}
              {!disabled && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className={cn(
                    "absolute flex h-6 w-6 items-center justify-center rounded-full bg-danger text-danger-foreground shadow-sm transition-opacity",
                    "hover:bg-danger/90",
                    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                    variant === "avatar"
                      ? "right-0 top-0"
                      : "right-2 top-2",
                  )}
                  aria-label="Remove image"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              {/* Upload icon */}
              <svg
                className="h-8 w-8 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <span className="text-sm text-muted-foreground">
                {placeholder}
              </span>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);

ImageUploader.displayName = "ImageUploader";
