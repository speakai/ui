import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "../../src/components/Progress";

describe("Progress", () => {
  it("sets aria-valuenow", () => {
    render(<Progress value={75} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "75");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps value to 0-100", () => {
    const { rerender } = render(<Progress value={-10} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    rerender(<Progress value={150} />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
  });

  it.each([
    [42, "42%"],
    [0, "0%"],
    [100, "100%"],
    [33.7, "34%"],
  ])("labels value %s as %s", (value, label) => {
    render(<Progress value={value} showLabel />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it.each([
    [60, "60%"],
    [-50, "0%"],
    [200, "100%"],
  ])("fills the bar for value %s to width %s", (value, width) => {
    const { container } = render(<Progress value={value} />);
    expect(container.querySelector("[style]")).toHaveStyle({ width });
  });
});
