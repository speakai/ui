import { forwardRef, HTMLAttributes, useState } from "react";
import { cn } from "../utils/cn";
import { getInitials } from "../utils/initials";

export type AvatarSize = "sm" | "default" | "lg";
export type AvatarVariant = "circle" | "rounded";
export type AvatarFit = "cover" | "contain";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  fit?: AvatarFit;
  imgReferrerPolicy?: ReferrerPolicy;
  imgLoading?: "lazy" | "eager";
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

const fitClasses: Record<AvatarFit, string> = {
  cover: "object-cover",
  contain: "object-contain",
};

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = "default", variant = "circle", fit = "cover", imgReferrerPolicy, imgLoading, className, ...props }, ref) => {
    const [imgError, setImgError] = useState(false);
    const showImage = src && !imgError;

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
          sizeClasses[size],
          variantClasses[variant],
          !showImage && "bg-gradient-to-br from-gradient-from to-gradient-to text-primary-foreground font-medium",
          className
        )}
        title={name}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={name}
            referrerPolicy={imgReferrerPolicy}
            loading={imgLoading}
            className={cn("h-full w-full", fitClasses[fit])}
            onError={() => setImgError(true)}
          />
        ) : (
          <span aria-hidden="true">{getInitials(name) || "?"}</span>
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";
