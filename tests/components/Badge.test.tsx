import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, StatusBadge, type BadgeVariant } from "../../src/components/Badge";

function badgeClassFor(variant: BadgeVariant): string {
  const { unmount } = render(<Badge variant={variant}>ref</Badge>);
  const className = screen.getByText("ref").className;
  unmount();
  return className;
}

describe("StatusBadge", () => {
  // Catches a "failed" status styled green; compares against Badge so no class tokens are pinned.
  it.each([
    ["active", "success"],
    ["completed", "success"],
    ["failed", "error"],
    ["error", "error"],
    ["pending", "warning"],
    ["processing", "warning"],
    ["inactive", "secondary"],
    ["Active", "success"],
    ["unknown", "default"],
  ] as const)("styles status %s like the %s badge", (status, variant) => {
    const expected = badgeClassFor(variant);
    render(<StatusBadge status={status} />);
    const badge = screen.getByRole("status");
    expect(badge).toHaveTextContent(status);
    expect(badge.className).toBe(expected);
  });
});
