import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Skeleton,
  SkeletonText,
  PageHeaderSkeleton,
  StatCardSkeleton,
  StatCardsSkeletonGrid,
  PageSkeleton,
  CardSkeleton,
  GridSkeleton,
  FormSkeleton,
} from "../../src/components/Skeleton";

describe("Skeleton", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("applies className", () => {
    const { container } = render(<Skeleton className="h-8 w-full" />);
    expect(container.firstChild).toHaveClass("h-8", "w-full");
  });
});

describe("SkeletonText", () => {
  it("renders default 3 lines", () => {
    const { container } = render(<SkeletonText />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
  });

  it("renders custom line count", () => {
    const { container } = render(<SkeletonText lines={5} />);
    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(5);
  });

  it("has aria-hidden", () => {
    const { container } = render(<SkeletonText />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("PageHeaderSkeleton", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<PageHeaderSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("StatCardSkeleton", () => {
  it("renders with aria-hidden", () => {
    const { container } = render(<StatCardSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("StatCardsSkeletonGrid", () => {
  it("renders 4 cards by default", () => {
    const { container } = render(<StatCardsSkeletonGrid />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(5); // 1 grid + 4 cards
  });

  it("renders custom count", () => {
    const { container } = render(<StatCardsSkeletonGrid count={2} />);
    // 1 grid wrapper (aria-hidden) + 2 card children (aria-hidden)
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
  });
});

describe("PageSkeleton", () => {
  it("renders with header, cards, and table rows", () => {
    const { container } = render(<PageSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("hides cards when showCards=false", () => {
    const { container } = render(<PageSkeleton showCards={false} />);
    // Should not have the grid of stat cards
    const grids = container.querySelectorAll(".grid");
    expect(grids).toHaveLength(0);
  });
});

describe("CardSkeleton", () => {
  it("renders default variant", () => {
    const { container } = render(<CardSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders agent variant with avatar circle", () => {
    const { container } = render(<CardSkeleton variant="agent" />);
    expect(container.querySelector(".rounded-full")).toBeInTheDocument();
  });
});

describe("GridSkeleton", () => {
  it("renders default 3 cards (1 row x 3 cols)", () => {
    const { container } = render(<GridSkeleton />);
    const cards = container.querySelectorAll('[aria-hidden="true"]');
    // 1 grid + 3 card wrappers
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it("renders custom count", () => {
    const { container } = render(<GridSkeleton count={6} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });
});

describe("FormSkeleton", () => {
  it("renders flat variant by default", () => {
    const { container } = render(<FormSkeleton />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders sections variant when sections prop provided", () => {
    const { container } = render(<FormSkeleton sections={2} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders specified number of fields", () => {
    const { container } = render(<FormSkeleton fields={6} />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("sections prop takes precedence over fields for variant", () => {
    const { container } = render(<FormSkeleton sections={2} fields={5} />);
    // Should render as sections variant (card-wrapped groups)
    const cards = container.querySelectorAll(".rounded-lg.border");
    expect(cards.length).toBe(2);
  });

  it("explicit variant=flat overrides sections prop", () => {
    const { container } = render(<FormSkeleton variant="flat" sections={3} fields={4} />);
    // Should render flat fields, not section cards
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
    // Flat variant has a flex justify-end submit button skeleton
    expect(container.querySelector(".flex.justify-end")).toBeInTheDocument();
  });
});

describe("SkeletonText edge cases", () => {
  it("renders 1 line with w-3/4 (last line pattern)", () => {
    const { container } = render(<SkeletonText lines={1} />);
    const lines = container.querySelectorAll(".animate-pulse");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveClass("w-3/4");
  });

  it("renders 0 lines (empty)", () => {
    const { container } = render(<SkeletonText lines={0} />);
    const lines = container.querySelectorAll(".animate-pulse");
    expect(lines).toHaveLength(0);
  });
});

describe("GridSkeleton edge cases", () => {
  it("count prop takes precedence over rows * columns", () => {
    const { container } = render(<GridSkeleton columns={3} rows={2} count={5} />);
    // Should render 5 cards, not 6 (3*2)
    const cards = container.querySelectorAll('[aria-hidden="true"]');
    // 1 grid wrapper + 5 card wrappers (each has nested aria-hidden elements)
    // Count the direct children of the grid
    const grid = container.firstChild as HTMLElement;
    expect(grid.children).toHaveLength(5);
  });

  const columnOptions = [2, 3, 4] as const;
  it.each(columnOptions)("applies correct grid classes for %s columns", (cols) => {
    const { container } = render(<GridSkeleton columns={cols} />);
    const grid = container.firstChild as HTMLElement;
    expect(grid.className).toContain("grid");
  });
});

describe("PageSkeleton edge cases", () => {
  it("respects custom cardCount", () => {
    const { container } = render(<PageSkeleton cardCount={2} />);
    const grids = container.querySelectorAll(".grid");
    expect(grids).toHaveLength(1);
    const grid = grids[0];
    expect(grid.children).toHaveLength(2);
  });

  it("respects custom tableRows", () => {
    const { container } = render(<PageSkeleton showCards={false} tableRows={3} />);
    const rows = container.querySelectorAll(".animate-pulse");
    // 2 from header skeleton + 3 table rows
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });
});
