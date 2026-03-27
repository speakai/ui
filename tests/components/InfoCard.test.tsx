import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InfoCard } from "../../src/components/InfoCard";

describe("InfoCard", () => {
  it("renders title", () => {
    render(<InfoCard title="Important" />);
    expect(screen.getByText("Important")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<InfoCard description="Some details here" />);
    expect(screen.getByText("Some details here")).toBeInTheDocument();
  });

  it("renders children", () => {
    render(<InfoCard><button>Action</button></InfoCard>);
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  const colors = ["purple", "blue", "green", "yellow", "red", "gray"] as const;
  it.each(colors)("renders %s color", (color) => {
    const { container } = render(<InfoCard color={color} title="Test" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
