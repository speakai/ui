import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuDivider,
  MoreButton,
} from "../../src/components/DropdownMenu";

describe("DropdownMenu", () => {
  it("renders trigger", () => {
    render(
      <DropdownMenu trigger={<button>Menu</button>}>
        <DropdownMenuItem>Item</DropdownMenuItem>
      </DropdownMenu>
    );
    expect(screen.getByText("Menu")).toBeInTheDocument();
  });

  it("opens on trigger click", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button>Menu</button>}>
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button>Menu</button>}>
        <DropdownMenuItem>Edit</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });

  it("has aria-haspopup and aria-expanded on trigger wrapper", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>Item</DropdownMenuItem>
      </DropdownMenu>
    );
    // The trigger wrapper div has role="button" with aria-haspopup
    const triggerWrapper = screen.getByRole("button");
    expect(triggerWrapper).toHaveAttribute("aria-haspopup", "true");
    expect(triggerWrapper).toHaveAttribute("aria-expanded", "false");
    await user.click(triggerWrapper);
    expect(triggerWrapper).toHaveAttribute("aria-expanded", "true");
  });

  it("supports controlled open state", () => {
    render(
      <DropdownMenu trigger={<button>Menu</button>} open={true} onOpenChange={() => {}}>
        <DropdownMenuItem>Visible</DropdownMenuItem>
      </DropdownMenu>
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
  });

  it("aligns left when align=left", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<button>Menu</button>} align="left">
        <DropdownMenuItem>Item</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByText("Menu"));
    // Portal mode: alignment is reflected via data-align, position via inline style.
    const menu = screen.getByRole("menu");
    expect(menu).toHaveAttribute("data-align", "left");
  });
});

describe("DropdownMenu keyboard navigation", () => {
  it("navigates items with ArrowDown", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>First</DropdownMenuItem>
        <DropdownMenuItem>Second</DropdownMenuItem>
        <DropdownMenuItem>Third</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button"));
    // First item auto-focused on open
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText("First"));
    });
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByText("Second"));
    await user.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(screen.getByText("Third"));
  });

  it("navigates items with ArrowUp", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>First</DropdownMenuItem>
        <DropdownMenuItem>Second</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText("First"));
    });
    // ArrowUp from first should wrap to last
    await user.keyboard("{ArrowUp}");
    expect(document.activeElement).toBe(screen.getByText("Second"));
  });

  it("navigates to first with Home key", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>First</DropdownMenuItem>
        <DropdownMenuItem>Second</DropdownMenuItem>
        <DropdownMenuItem>Third</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText("First"));
    });
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Home}");
    expect(document.activeElement).toBe(screen.getByText("First"));
  });

  it("navigates to last with End key", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>First</DropdownMenuItem>
        <DropdownMenuItem>Second</DropdownMenuItem>
        <DropdownMenuItem>Third</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText("First"));
    });
    await user.keyboard("{End}");
    expect(document.activeElement).toBe(screen.getByText("Third"));
  });

  it("skips disabled items during keyboard navigation", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>First</DropdownMenuItem>
        <DropdownMenuItem disabled>Disabled</DropdownMenuItem>
        <DropdownMenuItem>Third</DropdownMenuItem>
      </DropdownMenu>
    );
    await user.click(screen.getByRole("button"));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByText("First"));
    });
    await user.keyboard("{ArrowDown}");
    // Should skip disabled and go to Third
    expect(document.activeElement).toBe(screen.getByText("Third"));
  });

  it("opens with Enter on trigger", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>Item</DropdownMenuItem>
      </DropdownMenu>
    );
    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("opens with ArrowDown on trigger", async () => {
    const user = userEvent.setup();
    render(
      <DropdownMenu trigger={<span>Menu</span>}>
        <DropdownMenuItem>Item</DropdownMenuItem>
      </DropdownMenu>
    );
    screen.getByRole("button").focus();
    await user.keyboard("{ArrowDown}");
    expect(screen.getByText("Item")).toBeInTheDocument();
  });

  it("closes on click outside", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <DropdownMenu trigger={<span>Menu</span>}>
          <DropdownMenuItem>Item</DropdownMenuItem>
        </DropdownMenu>
        <button>Outside</button>
      </div>
    );
    // Open the menu by clicking the trigger wrapper
    await user.click(screen.getByText("Menu"));
    expect(screen.getByText("Item")).toBeInTheDocument();
    // Click outside using mousedown (component listens to mousedown)
    const outsideBtn = screen.getByText("Outside");
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.mouseDown(outsideBtn);
    await waitFor(() => {
      expect(screen.queryByText("Item")).not.toBeInTheDocument();
    });
  });

  it("renders triggerless mode when open is controlled without trigger", () => {
    render(
      <div style={{ position: "relative" }}>
        <DropdownMenu open={true} onOpenChange={() => {}}>
          <DropdownMenuItem>Contextual</DropdownMenuItem>
        </DropdownMenu>
      </div>
    );
    expect(screen.getByText("Contextual")).toBeInTheDocument();
  });

  it("returns null in triggerless mode when closed", () => {
    const { container } = render(
      <DropdownMenu open={false} onOpenChange={() => {}}>
        <DropdownMenuItem>Hidden</DropdownMenuItem>
      </DropdownMenu>
    );
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});

describe("DropdownMenuItem", () => {
  it("renders with role=menuitem", () => {
    render(<DropdownMenuItem>Edit</DropdownMenuItem>);
    expect(screen.getByRole("menuitem")).toBeInTheDocument();
  });

  it("fires onClick", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DropdownMenuItem onClick={onClick}>Edit</DropdownMenuItem>);
    await user.click(screen.getByRole("menuitem"));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders danger variant", () => {
    render(<DropdownMenuItem variant="danger">Delete</DropdownMenuItem>);
    expect(screen.getByRole("menuitem")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <DropdownMenuItem icon={<span data-testid="icon">*</span>}>
        Edit
      </DropdownMenuItem>
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("can be disabled", () => {
    render(<DropdownMenuItem disabled>Locked</DropdownMenuItem>);
    expect(screen.getByRole("menuitem")).toBeDisabled();
  });
});

describe("DropdownMenuHeader", () => {
  it("renders header text", () => {
    render(<DropdownMenuHeader>Actions</DropdownMenuHeader>);
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});

describe("DropdownMenuDivider", () => {
  it("renders with role=separator", () => {
    render(<DropdownMenuDivider />);
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});

describe("MoreButton", () => {
  it("renders with aria-label", () => {
    render(<MoreButton />);
    expect(screen.getByLabelText("More options")).toBeInTheDocument();
  });
});
