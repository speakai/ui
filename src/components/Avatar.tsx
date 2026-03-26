import { forwardRef, HTMLAttributes, useState } from "react";
import { cn } from "../utils/cn";

export type AvatarSize = "sm" | "default" | "lg";
export type AvatarVariant = "circle" | "rounded";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  default: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const variantClasses: Record<AvatarVariant, string> = {
  circle: "rounded-full",
  rounded: "rounded-lg",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = "default", variant = "circle", className, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
          sizeClasses[size],
          variantClasses[variant],
          !showImage && "bg-gradient-to-br from-gradient-from to-gradient-to text-white font-medium",
          className
        )}
        title={name}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-hidden="true">{getInitials(name)}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
