"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useRef,
  useState,
  DragEvent,
} from "react";
import { cn } from "../utils/cn";

// ── FileDropzone ─────────────────────────────────────────────────────────────

export interface FileDropzoneProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Called with the validated file list */
  onFiles: (files: File[]) => void;
  /** Accepted file types (e.g. "image/*,.pdf") */
  accept?: string;
  /** Allow multiple file selection (default true) */
  multiple?: boolean;
  /** Max file size in bytes per file */
  maxSize?: number;
  disabled?: boolean;
  /** Custom content inside the dropzone */
  children?: ReactNode;
}

export const FileDropzone = forwardRef<HTMLDivElement, FileDropzoneProps>(
  (
    {
      className,
      onFiles,
      accept,
      multiple = true,
      maxSize,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragCounter = useRef(0);

    const validate = useCallback(
      (fileList: FileList): File[] => {
        const files = Array.from(fileList);
        const selected = multiple ? files : files.slice(0, 1);

        if (maxSize) {
          const oversized = selected.filter((f) => f.size > maxSize);
          if (oversized.length > 0) {
            const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
            setError(
              `${oversized.length} file(s) exceed the ${sizeMB} MB limit`,
            );
            return selected.filter((f) => f.size <= maxSize);
          }
        }

        setError(null);
        return selected;
      },
      [maxSize, multiple],
    );

    const handleDragEnter = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;
        dragCounter.current += 1;
        if (dragCounter.current === 1) setIsDragging(true);
      },
      [disabled],
    );

    const handleDragLeave = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dragCounter.current -= 1;
        if (dragCounter.current === 0) setIsDragging(false);
      },
      [],
    );

    const handleDragOver = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
      },
      [],
    );

    const handleDrop = useCallback(
      (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        dragCounter.current = 0;
        setIsDragging(false);
        if (disabled) return;

        const valid = validate(e.dataTransfer.files);
        if (valid.length > 0) onFiles(valid);
      },
      [disabled, onFiles, validate],
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const valid = validate(e.target.files);
        if (valid.length > 0) onFiles(valid);
        e.target.value = "";
      },
      [onFiles, validate],
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
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors",
            "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            isDragging && "border-primary bg-primary/5",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
            tabIndex={-1}
            aria-hidden="true"
          />

          {children ?? (
            <div className="flex flex-col items-center gap-2 text-center">
              {/* Upload icon */}
              <svg
                className="h-10 w-10 text-muted-foreground"
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
              <p className="text-sm font-medium text-foreground">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                {accept
                  ? `Accepted: ${accept}`
                  : "All file types accepted"}
              </p>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    );
  },
);

FileDropzone.displayName = "FileDropzone";
