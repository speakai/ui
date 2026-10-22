import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "../../src/components/ErrorState";

describe("ErrorState", () => {
  it("shows retry button when onRetry provided", () => {
    render(<ErrorState onRetry={() => {}} />);
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("does not show retry button without onRetry", () => {
    render(<ErrorState />);
    expect(screen.queryByText("Try again")).not.toBeInTheDocument();
  });

  it("calls onRetry on button click", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await user.click(screen.getByText("Try again"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("uses custom retry label", () => {
    render(<ErrorState onRetry={() => {}} retryLabel="Reload" />);
    expect(screen.getByText("Reload")).toBeInTheDocument();
  });

  const variants = ["page", "card", "inline"] as const;
  it.each(variants)("renders %s variant", (variant) => {
    render(<ErrorState variant={variant} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
