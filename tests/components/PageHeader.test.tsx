import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageHeader, SectionHeader } from "../../src/components/PageHeader";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders gradient text", () => {
    render(<PageHeader title="Hello" gradientText="World" />);
    expect(screen.getByText("World")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<PageHeader title="Dashboard" description="Overview of your data" />);
    expect(screen.getByText("Overview of your data")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(<PageHeader title="Users" action={<button>Add User</button>} />);
    expect(screen.getByText("Add User")).toBeInTheDocument();
  });

  it("renders h1 for page header", () => {
    render(<PageHeader title="Page Title" />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page Title");
  });
});

describe("SectionHeader", () => {
  it("renders title", () => {
    render(<SectionHeader title="Settings" />);
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("renders h2 for section header", () => {
    render(<SectionHeader title="Section" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Section");
  });

  it("renders description", () => {
    render(<SectionHeader title="S" description="Section desc" />);
    expect(screen.getByText("Section desc")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(<SectionHeader title="S" action={<button>Edit</button>} />);
    expect(screen.getByText("Edit")).toBeInTheDocument();
  });
});
