import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";
import { Button } from "../../src/components/Button";

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    title: "Delete item?",
    description: "This action cannot be undone.",
  };

  it("renders nothing when closed", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Delete item?")).not.toBeInTheDocument();
  });

  it("renders title and description when open", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);
    await user.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onClose when cancel button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses custom confirm/cancel labels", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel="Yes, delete"
        cancelLabel="No, keep"
      />
    );
    expect(screen.getByText("Yes, delete")).toBeInTheDocument();
    expect(screen.getByText("No, keep")).toBeInTheDocument();
  });

  // ── Deprecated prop aliases ─────────────────────────────────────────────

  it("supports deprecated isOpen alias", () => {
    render(<ConfirmDialog {...defaultProps} open={undefined} isOpen={true} />);
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
  });

  it("supports deprecated onCancel alias", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        {...defaultProps}
        onClose={undefined}
        onCancel={onCancel}
      />
    );
    await user.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("supports deprecated message alias", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        description={undefined}
        message="Old message"
      />
    );
    expect(screen.getByText("Old message")).toBeInTheDocument();
  });

  it("supports deprecated confirmText alias", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        confirmLabel={undefined}
        confirmText="Delete"
      />
    );
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  // ── Loading state ─────────────────────────────────────────────────────

  it("disables cancel when loading", () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);
    expect(screen.getByText("Cancel")).toBeDisabled();
  });

  it("shows loading on confirm button when isLoading", () => {
    render(<ConfirmDialog {...defaultProps} isLoading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  // ── Missing description ───────────────────────────────────────────────

  it("renders without description", () => {
    render(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Are you sure?"
      />
    );
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    // No description paragraph
    const dialog = screen.getByRole("dialog");
    expect(dialog.querySelector("p.text-sm.text-muted-foreground")).not.toBeInTheDocument();
  });

  // ── Custom icon ───────────────────────────────────────────────────────

  it("renders custom icon instead of default", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        icon={<span data-testid="custom-icon">!</span>}
      />
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  // ── Variant button mapping ────────────────────────────────────────────

  // Catches a destructive confirm rendered as a plain primary button; compares against Button, not class tokens.
  it.each([
    ["danger", "danger"],
    ["warning", "primary"],
    ["info", "primary"],
  ] as const)("%s variant confirm button looks like a %s Button", (variant, buttonVariant) => {
    const { unmount } = render(<Button variant={buttonVariant} size="sm">Confirm</Button>);
    const expected = screen.getByRole("button", { name: "Confirm" }).className;
    unmount();
    render(<ConfirmDialog {...defaultProps} variant={variant} />);
    expect(screen.getByRole("button", { name: "Confirm" }).className).toBe(expected);
  });

  // ── Escape key ────────────────────────────────────────────────────────

  it("closes on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ConfirmDialog {...defaultProps} onClose={onClose} />);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  // ── Deprecated cancelText alias ───────────────────────────────────────

  it("supports deprecated cancelText alias", () => {
    render(
      <ConfirmDialog
        {...defaultProps}
        cancelLabel={undefined}
        cancelText="Nope"
      />
    );
    expect(screen.getByText("Nope")).toBeInTheDocument();
  });
});
