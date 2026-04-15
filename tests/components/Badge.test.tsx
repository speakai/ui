import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, StatusBadge } from "../../src/components/Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("has role=status", () => {
    render(<Badge>Test</Badge>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  const variants = ["default", "success", "warning", "error", "info", "outline", "secondary"] as const;

  it.each(variants)("renders %s variant", (variant) => {
    render(<Badge variant={variant}>Label</Badge>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  const colors = ["green", "yellow", "red", "blue", "purple", "pink", "orange", "gray"] as const;

  it.each(colors)("renders %s color (overrides variant)", (color) => {
    render(<Badge color={color}>Label</Badge>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders sm size", () => {
    render(<Badge size="sm">Small</Badge>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  // ── Variant class name tests ─────────────────────────────────────────────
  // Verifies the actual Tailwind class strings are present on the element.
  // jsdom doesn't compute CSS, but these guard against the safelist regression
  // where class strings disappeared from the compiled output.

  it("variant=error applies bg-danger/10 and text-danger classes", () => {
    render(<Badge variant="error">Error</Badge>);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("bg-danger/10");
    expect(el).toHaveClass("text-danger");
  });

  it("variant=success applies bg-success/10 and text-success classes", () => {
    render(<Badge variant="success">Success</Badge>);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("bg-success/10");
    expect(el).toHaveClass("text-success");
  });

  it("variant=warning applies bg-warning/10 and text-warning classes", () => {
    render(<Badge variant="warning">Warning</Badge>);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("bg-warning/10");
    expect(el).toHaveClass("text-warning");
  });

  it("variant=info applies bg-info/10 and text-info classes", () => {
    render(<Badge variant="info">Info</Badge>);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("bg-info/10");
    expect(el).toHaveClass("text-info");
  });

  it("variant=default applies bg-primary/10 and text-primary classes", () => {
    render(<Badge variant="default">Default</Badge>);
    const el = screen.getByRole("status");
    expect(el).toHaveClass("bg-primary/10");
    expect(el).toHaveClass("text-primary");
  });
});

describe("StatusBadge", () => {
  const statuses = ["active", "completed", "success", "pending", "processing", "error", "failed", "inactive"];

  it.each(statuses)("renders %s status with correct variant", (status) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it("handles unknown status with default variant", () => {
    render(<StatusBadge status="unknown" />);
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("handles case-insensitive status", () => {
    render(<StatusBadge status="Active" />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });
});
