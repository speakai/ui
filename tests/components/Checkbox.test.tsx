import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "../../src/components/Checkbox";

describe("Checkbox", () => {
  it("renders a checkbox input", () => {
    render(<Checkbox />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(<Checkbox label="Accept terms" />);
    expect(screen.getByText("Accept terms")).toBeInTheDocument();
    expect(screen.getByLabelText("Accept terms")).toBeInTheDocument();
  });

  it("renders description", () => {
    render(<Checkbox label="Newsletter" description="We won't spam you" />);
    expect(screen.getByText("We won't spam you")).toBeInTheDocument();
  });

  it("toggles on click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalled();
  });

  it("shows error border when error=true", () => {
    render(<Checkbox error />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows error message when error is string", () => {
    render(<Checkbox label="Terms" error="You must accept" />);
    expect(screen.getByText("You must accept")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is set", () => {
    render(<Checkbox disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  const sizes = ["sm", "default", "lg"] as const;
  it.each(sizes)("renders %s size", (size) => {
    render(<Checkbox size={size} />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("shows error message alongside description", () => {
    render(
      <Checkbox
        label="Terms"
        description="Please read first"
        error="Required"
      />
    );
    expect(screen.getByText("Please read first")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("does not render label/description container when neither provided", () => {
    const { container } = render(<Checkbox />);
    // Only the input, no wrapping div with label text
    expect(container.querySelector("label")).not.toBeInTheDocument();
  });

  it("generates id from label for htmlFor association", () => {
    render(<Checkbox label="Accept Terms" />);
    const checkbox = screen.getByRole("checkbox");
    const label = screen.getByText("Accept Terms");
    expect(label).toHaveAttribute("for", checkbox.id);
    expect(checkbox.id).toBe("checkbox-accept-terms");
  });

  it("uses provided id instead of generated one", () => {
    render(<Checkbox label="Test" id="custom-id" />);
    expect(screen.getByRole("checkbox")).toHaveAttribute("id", "custom-id");
  });

  it("disabled checkbox prevents click", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox disabled onChange={onChange} />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
