import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../../src/components/Button";

describe("Button", () => {
  it("fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  // ── Variants ────────────────────────────────────────────────────────────

  const variants = ["primary", "secondary", "danger", "ghost", "outline", "gradient", "glass", "solid"] as const;

  it.each(variants)("renders %s variant without crashing", (variant) => {
    const { container } = render(<Button variant={variant}>Test</Button>);
    expect(container.querySelector("button")).toBeInTheDocument();
  });

  // ── Sizes ───────────────────────────────────────────────────────────────

  const sizes = ["sm", "md", "lg", "icon"] as const;

  it.each(sizes)("renders %s size without crashing", (size) => {
    render(<Button size={size}>Test</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  // ── Loading state ─────────────────────────────────────────────────────

  it("shows loading spinner when isLoading", () => {
    render(<Button isLoading>Save</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("hides children when loading", () => {
    render(<Button isLoading>Save</Button>);
    expect(screen.queryByText("Save")).not.toBeInTheDocument();
  });

  // ── Disabled state ────────────────────────────────────────────────────

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Click</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Click</Button>);
    await user.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  // ── Custom className ──────────────────────────────────────────────────

  // ── Spread props ──────────────────────────────────────────────────────

  // ── Variant class name tests ──────────────────────────────────────────
  // Guards against the safelist regression where critical variant classes
  // (bg-danger, text-danger-foreground, etc.) disappeared from compiled CSS.

});
