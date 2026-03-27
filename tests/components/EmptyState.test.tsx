import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EmptyState } from "../../src/components/EmptyState";

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />);
    expect(screen.getByText("No items found")).toBeInTheDocument();
  });

  it("has role=status", () => {
    render(<EmptyState title="Empty" />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<EmptyState title="Empty" description="Try adding some items" />);
    expect(screen.getByText("Try adding some items")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(<EmptyState title="Empty" icon={<span data-testid="icon">*</span>} />);
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(<EmptyState title="Empty" action={<button>Add item</button>} />);
    expect(screen.getByText("Add item")).toBeInTheDocument();
  });

  const heights = ["sm", "md", "lg"] as const;
  it.each(heights)("renders %s height", (height) => {
    render(<EmptyState title="Empty" height={height} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
