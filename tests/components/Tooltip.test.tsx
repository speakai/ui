import { describe, it, expect, vi } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { Tooltip } from "../../src/components/Tooltip";

describe("Tooltip", () => {
  it("renders children", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  it("does not show tooltip initially", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on hover after delay", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Help text" delayMs={100}>
        <button>Hover me</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Hover me").closest("[class*='relative']")!;
    fireEvent.mouseEnter(wrapper);
    act(() => { vi.advanceTimersByTime(100); });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Help text");
    vi.useRealTimers();
  });

  it("hides tooltip on mouse leave", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Help text" delayMs={0}>
        <button>Hover me</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Hover me").closest("[class*='relative']")!;
    fireEvent.mouseEnter(wrapper);
    act(() => { vi.advanceTimersByTime(0); });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not show tooltip when disabled", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Help text" delayMs={0} disabled>
        <button>Hover me</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Hover me").closest("[class*='relative']")!;
    fireEvent.mouseEnter(wrapper);
    act(() => { vi.advanceTimersByTime(0); });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  const sides = ["top", "bottom", "left", "right"] as const;
  it.each(sides)("supports %s placement", (side) => {
    const { container } = render(
      <Tooltip content="Help" side={side}>
        <button>Test</button>
      </Tooltip>
    );
    expect(container).toBeInTheDocument();
  });

  it("shows tooltip on focus", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Focus help" delayMs={0}>
        <button>Focus me</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Focus me").closest("[class*='relative']")!;
    fireEvent.focus(wrapper);
    act(() => { vi.advanceTimersByTime(0); });
    expect(screen.getByRole("tooltip")).toHaveTextContent("Focus help");
    vi.useRealTimers();
  });

  it("hides tooltip on blur", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="Focus help" delayMs={0}>
        <button>Focus me</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Focus me").closest("[class*='relative']")!;
    fireEvent.focus(wrapper);
    act(() => { vi.advanceTimersByTime(0); });
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(wrapper);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("does not show tooltip with empty content", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content="" delayMs={0}>
        <button>Hover</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Hover").closest("[class*='relative']")!;
    fireEvent.mouseEnter(wrapper);
    act(() => { vi.advanceTimersByTime(0); });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders ReactNode content", () => {
    vi.useFakeTimers();
    render(
      <Tooltip content={<strong data-testid="rich">Bold tip</strong>} delayMs={0}>
        <button>Hover</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Hover").closest("[class*='relative']")!;
    fireEvent.mouseEnter(wrapper);
    act(() => { vi.advanceTimersByTime(0); });
    expect(screen.getByTestId("rich")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("cleans up timer on unmount", () => {
    vi.useFakeTimers();
    const { unmount } = render(
      <Tooltip content="Tip" delayMs={500}>
        <button>Hover</button>
      </Tooltip>
    );
    const wrapper = screen.getByText("Hover").closest("[class*='relative']")!;
    fireEvent.mouseEnter(wrapper);
    unmount();
    // Advancing timers after unmount should not throw
    act(() => { vi.advanceTimersByTime(500); });
    vi.useRealTimers();
  });
});
