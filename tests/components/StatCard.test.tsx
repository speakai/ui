import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatCard, StatCardGrid } from "../../src/components/StatCard";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total Users" value={1234} />);
    expect(screen.getByText("Total Users")).toBeInTheDocument();
    expect(screen.getByText("1234")).toBeInTheDocument();
  });

  it("renders string value", () => {
    render(<StatCard label="Revenue" value="$12,345" />);
    expect(screen.getByText("$12,345")).toBeInTheDocument();
  });

  it("renders icon when provided", () => {
    render(
      <StatCard
        label="Users"
        value={42}
        icon={<span data-testid="icon">*</span>}
      />
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("hides icon container with aria-hidden", () => {
    const { container } = render(
      <StatCard label="Users" value={42} icon={<span>*</span>} />
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  const iconColors = ["purple", "pink", "blue", "green", "orange", "red"] as const;
  it.each(iconColors)("renders %s icon color", (color) => {
    render(
      <StatCard label="Test" value={0} icon={<span>*</span>} iconColor={color} />
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders gradient variant", () => {
    const { container } = render(
      <StatCard label="Premium" value="$99" variant="gradient" />
    );
    expect(container.firstChild?.className).toContain("bg-gradient");
  });

  it("applies valueClassName to value", () => {
    render(<StatCard label="Custom" value="42" valueClassName="text-red-500" />);
    expect(screen.getByText("42")).toHaveClass("text-red-500");
  });
});

describe("StatCardGrid", () => {
  it("renders children in a grid", () => {
    render(
      <StatCardGrid>
        <StatCard label="A" value={1} />
        <StatCard label="B" value={2} />
      </StatCardGrid>
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  const columns = [2, 3, 4] as const;
  it.each(columns)("renders %s columns grid", (cols) => {
    const { container } = render(
      <StatCardGrid columns={cols}>
        <StatCard label="A" value={1} />
      </StatCardGrid>
    );
    expect(container.firstChild).toHaveClass("grid");
  });
});
