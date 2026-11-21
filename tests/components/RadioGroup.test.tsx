import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RadioGroup } from "../../src/components/RadioGroup";

const options = [
  { value: "external", label: "External calls only" },
  { value: "internal", label: "Internal calls only", description: "Calls between colleagues" },
  { value: "all", label: "Both", disabled: true },
];

describe("RadioGroup", () => {
  it("gives every radio its option label as its accessible name", () => {
    render(<RadioGroup value="external" onChange={() => {}} options={options} aria-label="Calls" />);
    expect(screen.getByRole("radio", { name: "External calls only" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Internal calls only" })).toHaveAttribute("aria-checked", "false");
    expect(screen.getByRole("radio", { name: "Both" })).toHaveAttribute("aria-disabled", "true");
  });

  it("describes a radio with its option description", () => {
    render(<RadioGroup value="external" onChange={() => {}} options={options} />);
    expect(screen.getByRole("radio", { name: "Internal calls only" })).toHaveAccessibleDescription(
      "Calls between colleagues",
    );
  });

  it("selects an option when its label text is clicked", () => {
    const onChange = vi.fn();
    render(<RadioGroup value="external" onChange={onChange} options={options} />);
    fireEvent.click(screen.getByText("Internal calls only"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("internal");
  });

  it("selects once when the circle itself is clicked", () => {
    const onChange = vi.fn();
    render(<RadioGroup value="external" onChange={onChange} options={options} />);
    fireEvent.click(screen.getByRole("radio", { name: "Internal calls only" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("internal");
  });

  it("ignores clicks on a disabled option's text", () => {
    const onChange = vi.fn();
    render(<RadioGroup value="external" onChange={onChange} options={options} />);
    fireEvent.click(screen.getByText("Both"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
