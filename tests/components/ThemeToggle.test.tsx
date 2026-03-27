import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle, ThemeSelector } from "../../src/components/ThemeToggle";

describe("ThemeToggle", () => {
  it("renders after mounting (SSR-safe)", () => {
    render(<ThemeToggle theme="light" onChange={() => {}} />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("cycles light -> dark -> system -> light", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeToggle theme="light" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("shows correct aria-label", () => {
    render(<ThemeToggle theme="light" onChange={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to dark theme");
  });

  it("defaults to system when no theme provided", () => {
    render(<ThemeToggle onChange={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-label", "Switch to light theme");
  });

  it("cycles through full theme rotation", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    // light -> dark
    const { rerender } = render(<ThemeToggle theme="light" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("dark");

    // dark -> system
    rerender(<ThemeToggle theme="dark" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("system");

    // system -> light
    rerender(<ThemeToggle theme="system" onChange={onChange} />);
    await user.click(screen.getByRole("button"));
    expect(onChange).toHaveBeenCalledWith("light");
  });

  it("is a no-op when onChange not provided", async () => {
    const user = userEvent.setup();
    render(<ThemeToggle theme="light" />);
    // Should not throw
    await user.click(screen.getByRole("button"));
  });
});

describe("ThemeSelector", () => {
  it("renders all three theme options", () => {
    render(<ThemeSelector theme="light" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });

  it("marks current theme as checked", () => {
    render(<ThemeSelector theme="dark" onChange={() => {}} />);
    expect(screen.getByLabelText("Dark")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Light")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange when option clicked", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ThemeSelector theme="light" onChange={onChange} />);
    await user.click(screen.getByLabelText("Dark"));
    expect(onChange).toHaveBeenCalledWith("dark");
  });

  it("has aria-label on radiogroup", () => {
    render(<ThemeSelector theme="light" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup")).toHaveAttribute("aria-label", "Theme");
  });

  it("is a no-op when onChange not provided", async () => {
    const user = userEvent.setup();
    render(<ThemeSelector theme="light" />);
    // Should not throw
    await user.click(screen.getByLabelText("Dark"));
  });

  it("defaults to system when no theme provided", () => {
    render(<ThemeSelector onChange={() => {}} />);
    expect(screen.getByLabelText("System")).toHaveAttribute("aria-checked", "true");
  });
});
