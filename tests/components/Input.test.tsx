import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, Select, Textarea } from "../../src/components/Input";

describe("Input", () => {
  it("accepts user input", async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Name" />);
    const input = screen.getByPlaceholderText("Name");
    await user.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("shows error border when error=true", () => {
    render(<Input error />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows error message when error is a string", () => {
    render(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not show error message when error is empty string", () => {
    render(<Input error="" />);
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Select", () => {
  it("prefers children over options prop", () => {
    render(
      <Select options={[{ value: "a", label: "A" }]}>
        <option value="custom">Custom</option>
      </Select>
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.queryByText("A")).not.toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<Select error="Select required" options={[]} />);
    expect(screen.getByText("Select required")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Textarea", () => {
  it("accepts multiline input", async () => {
    const user = userEvent.setup();
    render(<Textarea placeholder="Bio" />);
    const textarea = screen.getByPlaceholderText("Bio");
    await user.type(textarea, "Line 1{enter}Line 2");
    expect(textarea).toHaveValue("Line 1\nLine 2");
  });

  it("shows error state", () => {
    render(<Textarea error="Too short" />);
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });
});
