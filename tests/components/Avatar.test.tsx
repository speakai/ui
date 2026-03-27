import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Avatar } from "../../src/components/Avatar";

describe("Avatar", () => {
  it("shows initials when no src", () => {
    render(<Avatar name="John Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows single initial for single name", () => {
    render(<Avatar name="Alice" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("shows image when src provided", () => {
    render(<Avatar name="John" src="/avatar.jpg" />);
    const img = screen.getByAltText("John");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "/avatar.jpg");
  });

  it("falls back to initials on image error", () => {
    render(<Avatar name="John Doe" src="/broken.jpg" />);
    const img = screen.getByAltText("John Doe");
    fireEvent.error(img);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  it("shows title with name", () => {
    const { container } = render(<Avatar name="Jane Smith" />);
    expect(container.firstChild).toHaveAttribute("title", "Jane Smith");
  });

  it("handles empty name gracefully", () => {
    render(<Avatar name="" />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("handles multi-word name (first + last initial)", () => {
    render(<Avatar name="John William Doe" />);
    expect(screen.getByText("JD")).toBeInTheDocument();
  });

  const sizes = ["sm", "default", "lg"] as const;
  it.each(sizes)("renders %s size", (size) => {
    const { container } = render(<Avatar name="Test" size={size} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  const variants = ["circle", "rounded"] as const;
  it.each(variants)("renders %s variant", (variant) => {
    const { container } = render(<Avatar name="Test" variant={variant} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("handles whitespace-only name", () => {
    render(<Avatar name="   " />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("circle variant has rounded-full class", () => {
    const { container } = render(<Avatar name="Test" variant="circle" />);
    expect(container.firstChild).toHaveClass("rounded-full");
  });

  it("rounded variant has rounded-lg class", () => {
    const { container } = render(<Avatar name="Test" variant="rounded" />);
    expect(container.firstChild).toHaveClass("rounded-lg");
  });

  it("shows gradient background for initials mode", () => {
    const { container } = render(<Avatar name="Test" />);
    expect(container.firstChild?.className).toContain("bg-gradient");
  });

  it("does not show gradient background for image mode", () => {
    const { container } = render(<Avatar name="Test" src="/photo.jpg" />);
    expect(container.firstChild?.className).not.toContain("bg-gradient");
  });

  it("initials are aria-hidden", () => {
    const { container } = render(<Avatar name="John Doe" />);
    const initialsSpan = container.querySelector("span");
    expect(initialsSpan).toHaveAttribute("aria-hidden", "true");
  });
});
