import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ColorPicker } from "../../src/components/ColorPicker";

describe("ColorPicker", () => {
  it("names the hex input with the visible label", () => {
    render(<ColorPicker value="#a855f7" onChange={vi.fn()} label="Brand color" />);
    expect(screen.getByLabelText("Brand color")).toHaveValue("#a855f7");
  });

  it("applies custom aria labels for translated callers", () => {
    render(
      <ColorPicker
        value="#a855f7"
        onChange={vi.fn()}
        presetColors={["#ff0000"]}
        pickerAriaLabel="Elegir un color"
        inputAriaLabel="Color hexadecimal"
        swatchAriaLabel={(color) => `Seleccionar ${color}`}
      />,
    );
    expect(screen.getByRole("button", { name: "Elegir un color" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Color hexadecimal" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar #ff0000" })).toBeInTheDocument();
  });

  it("keeps English defaults when no labels are passed", () => {
    render(<ColorPicker value="#a855f7" onChange={vi.fn()} presetColors={["#ff0000"]} />);
    expect(screen.getByRole("button", { name: "Pick a color" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Hex color" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Select color #ff0000" })).toBeInTheDocument();
  });
});
