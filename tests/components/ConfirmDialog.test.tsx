import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "../../src/components/ConfirmDialog";

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

  // ── Variants ────────────────────────────────────────────────────────────

  const variants = ["danger", "warning", "info"] as const;

  it.each(variants)("renders %s variant", (variant) => {
    render(<ConfirmDialog {...defaultProps} variant={variant} />);
    expect(screen.getByText("Delete item?")).toBeInTheDocument();
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

  it("danger variant uses danger confirm button", () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} variant="danger" />
    );
    // The confirm button should have danger styling
    const buttons = container.querySelectorAll("button");
    const confirmBtn = Array.from(buttons).find(b => b.textContent === "Confirm");
    expect(confirmBtn?.className).toContain("bg-danger");
  });

  it("info variant uses primary confirm button", () => {
    const { container } = render(
      <ConfirmDialog {...defaultProps} variant="info" />
    );
    const buttons = container.querySelectorAll("button");
    const confirmBtn = Array.from(buttons).find(b => b.textContent === "Confirm");
    expect(confirmBtn?.className).toContain("bg-primary");
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
