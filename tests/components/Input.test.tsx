import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input, SearchInput, Select, Textarea } from "../../src/components/Input";

describe("Input", () => {
  it("renders an input element", () => {
    render(<Input placeholder="Type here" />);
    expect(screen.getByPlaceholderText("Type here")).toBeInTheDocument();
  });

  it("forwards ref", () => {
    const ref = vi.fn<(node: HTMLInputElement | null) => void>();
    render(<Input ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement));
  });

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

describe("SearchInput", () => {
  it("renders search input", () => {
    render(<SearchInput placeholder="Search..." />);
    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("sets type=search", () => {
    render(<SearchInput placeholder="Search" />);
    expect(screen.getByPlaceholderText("Search")).toHaveAttribute("type", "search");
  });

  it("applies containerClassName to wrapper", () => {
    const { container } = render(<SearchInput containerClassName="my-wrapper" />);
    expect(container.querySelector(".my-wrapper")).toBeInTheDocument();
  });
});

describe("Select", () => {
  it("renders options from prop", () => {
    render(
      <Select
        options={[
          { value: "a", label: "Alpha" },
          { value: "b", label: "Beta" },
        ]}
      />
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("renders placeholder option", () => {
    render(<Select placeholder="Choose..." options={[{ value: "a", label: "A" }]} />);
    expect(screen.getByText("Choose...")).toBeInTheDocument();
  });

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
  it("renders a textarea", () => {
    render(<Textarea placeholder="Write here" />);
    expect(screen.getByPlaceholderText("Write here")).toBeInTheDocument();
  });

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
