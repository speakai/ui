import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "../../src/components/Card";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn<(node: HTMLDivElement | null) => void>();
    render(<Card ref={ref}>Test</Card>);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  const variants = ["default", "outline", "elevated", "glass"] as const;

  it.each(variants)("renders %s variant", (variant) => {
    const { container } = render(<Card variant={variant}>Content</Card>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("shows gradient accent when enabled", () => {
    const { container } = render(<Card showGradientAccent>Content</Card>);
    const accent = container.querySelector('[aria-hidden="true"]');
    expect(accent).toBeInTheDocument();
  });

  it("does not show gradient accent by default", () => {
    const { container } = render(<Card>Content</Card>);
    const accent = container.querySelector('[aria-hidden="true"]');
    expect(accent).not.toBeInTheDocument();
  });

  it("merges custom className", () => {
    const { container } = render(<Card className="custom">Content</Card>);
    expect(container.firstChild).toHaveClass("custom");
  });
});
