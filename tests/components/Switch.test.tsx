import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "../../src/components/Switch";

describe("Switch", () => {
  it("reflects checked state via aria-checked", () => {
    const { rerender } = render(<Switch checked={false} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");

    rerender(<Switch checked={true} onChange={() => {}} />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  });

  it("calls onChange on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles off when checked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={true} onChange={onChange} />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("does not toggle when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} disabled />);
    await user.click(screen.getByRole("switch"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("toggles on Enter key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    screen.getByRole("switch").focus();
    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("toggles on Space key", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Switch checked={false} onChange={onChange} />);
    screen.getByRole("switch").focus();
    await user.keyboard(" ");
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("sets aria-label from label prop", () => {
    render(<Switch checked={false} onChange={() => {}} label="Notifications" />);
    expect(screen.getByRole("switch")).toHaveAttribute("aria-label", "Notifications");
  });

  const sizes = ["sm", "default"] as const;
  it.each(sizes)("renders %s size", (size) => {
    render(<Switch checked={false} onChange={() => {}} size={size} />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });
});
