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

  // Each variant is a separate render branch; catches one dropping the title, message or retry.
  it.each(["page", "card", "inline"] as const)("%s variant announces title and message and wires retry", async (variant) => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState variant={variant} title="Upload failed" message="File too large" onRetry={onRetry} />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Upload failed");
    expect(alert).toHaveTextContent("File too large");
    await user.click(screen.getByRole("button", { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
