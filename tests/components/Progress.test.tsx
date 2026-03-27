import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Progress } from "../../src/components/Progress";

describe("Progress", () => {
  it("renders with role=progressbar", () => {
    render(<Progress value={50} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

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

  it("shows percentage label when showLabel=true", () => {
    render(<Progress value={42} showLabel />);
    expect(screen.getByText("42%")).toBeInTheDocument();
  });

  it("does not show label by default", () => {
    render(<Progress value={42} />);
    expect(screen.queryByText("42%")).not.toBeInTheDocument();
  });

  it("sets width style on inner bar", () => {
    const { container } = render(<Progress value={60} />);
    const innerBar = container.querySelector("[style]");
    expect(innerBar).toHaveStyle({ width: "60%" });
  });

  const sizes = ["sm", "default"] as const;
  it.each(sizes)("renders %s size", (size) => {
    render(<Progress value={50} size={size} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  const variants = ["default", "gradient"] as const;
  it.each(variants)("renders %s variant", (variant) => {
    render(<Progress value={50} variant={variant} />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("shows 0% label for value 0", () => {
    render(<Progress value={0} showLabel />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("shows 100% label for value 100", () => {
    render(<Progress value={100} showLabel />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("rounds display label for fractional values", () => {
    render(<Progress value={33.7} showLabel />);
    expect(screen.getByText("34%")).toBeInTheDocument();
  });

  it("clamps negative to 0% width", () => {
    const { container } = render(<Progress value={-50} />);
    const innerBar = container.querySelector("[style]");
    expect(innerBar).toHaveStyle({ width: "0%" });
  });

  it("clamps >100 to 100% width", () => {
    const { container } = render(<Progress value={200} />);
    const innerBar = container.querySelector("[style]");
    expect(innerBar).toHaveStyle({ width: "100%" });
  });

  it("forwards aria-label to progressbar element", () => {
    render(<Progress value={50} aria-label="Upload progress" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-label", "Upload progress");
  });

  it("forwards aria-labelledby to progressbar element", () => {
    render(
      <div>
        <span id="label">Upload</span>
        <Progress value={50} aria-labelledby="label" />
      </div>
    );
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-labelledby", "label");
  });

  it("gradient variant has gradient classes", () => {
    const { container } = render(<Progress value={50} variant="gradient" />);
    const innerBar = container.querySelector("[style]");
    expect(innerBar?.className).toContain("bg-gradient");
  });
});
