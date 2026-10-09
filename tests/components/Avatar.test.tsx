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

  it("draws initials in the theme's primary foreground so they stay readable in dark mode", () => {
    const { container } = render(<Avatar name="Vatsal Patel" />);
    expect(container.firstChild).toHaveClass("text-primary-foreground");
    expect(container.firstChild).not.toHaveClass("text-white");
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

});
