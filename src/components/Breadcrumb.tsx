import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  /** Max items to show before truncating with ellipsis. 0 = no truncation. */
  maxItems?: number;
}

function truncateItems(items: BreadcrumbItem[], maxItems: number): (BreadcrumbItem | "ellipsis")[] {
  if (maxItems <= 0 || items.length <= maxItems) return items;
  // Show first item, ellipsis, then last (maxItems - 2) items (minimum last 2)
  const tailCount = Math.max(2, maxItems - 1);
  if (items.length <= tailCount + 1) return items;
  return [items[0], "ellipsis" as const, ...items.slice(-tailCount)];
}

export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ items, separator = "/", maxItems = 0, className, ...props }, ref) => {
    const displayItems = truncateItems(items, maxItems);

    return (
      <nav ref={ref} aria-label="Breadcrumb" className={cn("text-sm", className)} {...props}>
        <ol className="flex flex-wrap items-center gap-1.5">
          {displayItems.map((item, index) => {
            const isLast =
              index === displayItems.length - 1 && item !== "ellipsis";
            const isEllipsis = item === "ellipsis";

            return (
              <li key={index} className="inline-flex items-center gap-1.5">
                {index > 0 && (
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground/60 select-none"
                  >
                    {separator}
                  </span>
                )}

                {isEllipsis ? (
                  <span className="text-muted-foreground select-none" aria-hidden="true">
                    &#8230;
                  </span>
                ) : isLast ? (
                  <span
                    aria-current="page"
                    className="font-medium text-foreground"
                  >
                    {(item as BreadcrumbItem).label}
                  </span>
                ) : (item as BreadcrumbItem).href ? (
                  <a
                    href={(item as BreadcrumbItem).href}
                    className={cn(
                      "text-muted-foreground transition-colors hover:text-foreground",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm",
                    )}
                  >
                    {(item as BreadcrumbItem).label}
                  </a>
                ) : (item as BreadcrumbItem).onClick ? (
                  <button
                    type="button"
                    onClick={(item as BreadcrumbItem).onClick}
                    className={cn(
                      "text-muted-foreground transition-colors hover:text-foreground",
                      "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm",
                    )}
                  >
                    {(item as BreadcrumbItem).label}
                  </button>
                ) : (
                  <span className="text-muted-foreground">
                    {(item as BreadcrumbItem).label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  },
);
Breadcrumb.displayName = "Breadcrumb";
