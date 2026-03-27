import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorState } from "../../src/components/ErrorState";

describe("ErrorState", () => {
  it("renders default title and message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
  });

  it("has role=alert", () => {
    render(<ErrorState />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders custom title and message", () => {
    render(<ErrorState title="404 Not Found" message="The page doesn't exist." />);
    expect(screen.getByText("404 Not Found")).toBeInTheDocument();
    expect(screen.getByText("The page doesn't exist.")).toBeInTheDocument();
  });

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
