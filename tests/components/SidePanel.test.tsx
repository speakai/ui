import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SidePanel } from "../../src/components/SidePanel";

describe("SidePanel", () => {
  it("renders with role=dialog when open", () => {
    render(<SidePanel open onClose={() => {}} title="Details">Content</SidePanel>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has aria-modal=true", () => {
    render(<SidePanel open onClose={() => {}} title="Details">Content</SidePanel>);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
  });

  it("has aria-label from title", () => {
    render(<SidePanel open onClose={() => {}} title="Edit User">Content</SidePanel>);
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-label", "Edit User");
  });

  it("renders title in header", () => {
    render(<SidePanel open onClose={() => {}} title="Panel Title">Content</SidePanel>);
    expect(screen.getByText("Panel Title")).toBeInTheDocument();
  });

  it("renders close button", () => {
    render(<SidePanel open onClose={() => {}} title="Test">Content</SidePanel>);
    expect(screen.getByLabelText("Close panel")).toBeInTheDocument();
  });

  it("calls onClose when close button clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SidePanel open onClose={onClose} title="Test">Content</SidePanel>);
    await user.click(screen.getByLabelText("Close panel"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose on Escape key", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SidePanel open onClose={onClose} title="Test">Content</SidePanel>);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders back button when showBack and onBack", () => {
    render(
      <SidePanel open onClose={() => {}} title="Sub" showBack onBack={() => {}}>
        Content
      </SidePanel>
    );
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
  });

  it("calls onBack when back button clicked", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    render(
      <SidePanel open onClose={() => {}} title="Sub" showBack onBack={onBack}>
        Content
      </SidePanel>
    );
    await user.click(screen.getByLabelText("Go back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders footer when provided", () => {
    render(
      <SidePanel open onClose={() => {}} title="Test" footer={<button>Save</button>}>
        Content
      </SidePanel>
    );
    expect(screen.getByText("Save")).toBeInTheDocument();
  });

  it("renders custom header instead of title", () => {
    render(
      <SidePanel open onClose={() => {}} header={<div>Custom Header</div>}>
        Content
      </SidePanel>
    );
    expect(screen.getByText("Custom Header")).toBeInTheDocument();
  });

  it("locks body scroll when open with backdrop", () => {
    const { unmount } = render(
      <SidePanel open onClose={() => {}} title="Test" backdrop>Content</SidePanel>
    );
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  const sides = ["left", "right"] as const;
  it.each(sides)("renders on %s side", (side) => {
    render(<SidePanel open onClose={() => {}} title="Test" side={side}>Content</SidePanel>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  const sizes = ["sm", "default", "lg", "xl", "full"] as const;
  it.each(sizes)("renders %s size", (size) => {
    render(<SidePanel open onClose={() => {}} title="Test" size={size}>Content</SidePanel>);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
