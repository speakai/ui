import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseButton,
} from "../../src/components/Dialog";

describe("Dialog", () => {
  it("renders nothing when closed", () => {
    render(
      <Dialog open={false} onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(screen.queryByText("Content")).not.toBeInTheDocument();
  });

  it("renders content when open", () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("has role=dialog and aria-modal", () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("calls onClose on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose on backdrop click", () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    // The overlay is the outermost fixed div that contains the dialog panel
    const overlay = document.querySelector(".fixed.inset-0") as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not call onClose when clicking inside dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    await user.click(screen.getByText("Content"));
    expect(onClose).not.toHaveBeenCalled();
  });

  const sizes = ["sm", "default", "lg", "xl", "full"] as const;
  it.each(sizes)("renders %s size", (size) => {
    render(
      <Dialog open onClose={() => {}} size={size}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("locks body scroll when open", () => {
    const { unmount } = render(
      <Dialog open onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Dialog focus trap", () => {
  it("traps Tab at last focusable element (wraps to first)", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>
          <input data-testid="first" />
          <input data-testid="second" />
          <button data-testid="last">OK</button>
        </DialogBody>
      </Dialog>
    );
    // Focus the last element, then Tab should wrap to first
    screen.getByTestId("last").focus();
    await user.tab();
    // Should wrap back to the first focusable element
    expect(document.activeElement).toBe(screen.getByTestId("first"));
  });

  it("traps Shift+Tab at first focusable element (wraps to last)", () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>
          <input data-testid="first" />
          <button data-testid="last">OK</button>
        </DialogBody>
      </Dialog>
    );
    // Manually focus the first element
    screen.getByTestId("first").focus();
    // The focus trap uses a document keydown listener — fire it directly
    const event = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true });
    const prevented = !document.dispatchEvent(event);
    // After the handler runs, focus should be on the last element
    expect(document.activeElement).toBe(screen.getByTestId("last"));
  });

  it("prevents Tab when no focusable elements", async () => {
    const user = userEvent.setup();
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody><p>No interactive content</p></DialogBody>
      </Dialog>
    );
    // Should not throw — just prevents default
    await user.tab();
    // Dialog panel itself should be focused (tabindex=-1 set)
  });

  it("auto-focuses first focusable element on open", async () => {
    render(
      <Dialog open onClose={() => {}}>
        <DialogBody>
          <input data-testid="auto-focus" />
          <button>OK</button>
        </DialogBody>
      </Dialog>
    );
    // Wait for rAF to fire
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(screen.getByTestId("auto-focus"));
    });
  });

  it("restores body scroll after unmount", () => {
    const { rerender } = render(
      <Dialog open onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(document.body.style.overflow).toBe("hidden");
    rerender(
      <Dialog open={false} onClose={() => {}}>
        <DialogBody>Content</DialogBody>
      </Dialog>
    );
    expect(document.body.style.overflow).toBe("");
  });
});

describe("Dialog sub-components", () => {
  it("DialogHeader renders", () => {
    render(<DialogHeader>Title</DialogHeader>);
    expect(screen.getByText("Title")).toBeInTheDocument();
  });

  it("DialogBody renders", () => {
    render(<DialogBody>Body content</DialogBody>);
    expect(screen.getByText("Body content")).toBeInTheDocument();
  });

  it("DialogFooter renders", () => {
    render(<DialogFooter>Footer</DialogFooter>);
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });

  it("DialogCloseButton calls onClose", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<DialogCloseButton onClose={onClose} />);
    await user.click(screen.getByLabelText("Close dialog"));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
