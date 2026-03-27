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
