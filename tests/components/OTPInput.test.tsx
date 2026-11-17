import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { OTPInput, type OTPInputProps } from "../../src/components/OTPInput";

function Controlled({ initial = "", ...props }: Partial<OTPInputProps> & { initial?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <OTPInput value={value} onChange={setValue} {...props} />
      <output data-testid="value">{value}</output>
    </>
  );
}

const boxes = () => screen.getAllByRole("textbox") as HTMLInputElement[];
const shownValue = () => screen.getByTestId("value").textContent;

describe("OTPInput", () => {
  it("asks for the one-time code on the first box only, with a numeric keypad", () => {
    render(<Controlled />);
    const [first, ...rest] = boxes();
    expect(first).toHaveAttribute("autocomplete", "one-time-code");
    expect(first).toHaveAttribute("inputmode", "numeric");
    expect(first).not.toHaveAttribute("maxlength");
    rest.forEach((box) => expect(box).toHaveAttribute("autocomplete", "off"));
  });

  it.each([
    ["autofill of the full code into the first box", 0, "123456", "123456", 5],
    ["full code into a later box starts at the first box", 3, "654321", "654321", 5],
    ["digits mixed with other characters", 0, "12-34 56", "123456", 5],
    ["a longer string is cut to the box count", 0, "12345678", "123456", 5],
  ])("spreads %s", (_label, index, input, expected, focused) => {
    render(<Controlled />);
    fireEvent.change(boxes()[index], { target: { value: input } });
    expect(shownValue()).toBe(expected);
    expect(boxes().map((box) => box.value).join("")).toBe(expected);
    expect(boxes()[focused]).toHaveFocus();
  });

  it("spreads a partial paste from the pasted box onward", () => {
    render(<Controlled initial="12" />);
    fireEvent.paste(boxes()[2], { clipboardData: { getData: () => "345" } });
    expect(shownValue()).toBe("12345");
    expect(boxes()[5]).toHaveFocus();
  });

  it("overwrites a digit when a second digit is typed into a filled box", () => {
    render(<Controlled initial="123" />);
    fireEvent.change(boxes()[1], { target: { value: "29" } });
    expect(shownValue()).toBe("193");
    fireEvent.change(boxes()[1], { target: { value: "79" } });
    expect(shownValue()).toBe("173");
  });

  it("ignores a paste without digits", () => {
    render(<Controlled initial="1" />);
    fireEvent.paste(boxes()[0], { clipboardData: { getData: () => "abc" } });
    expect(shownValue()).toBe("1");
  });

  it("labels the group 'Verification code' by default", () => {
    render(<Controlled />);
    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
  });

  it("lets the consumer rename the group with aria-label or aria-labelledby", () => {
    const { unmount } = render(<Controlled aria-label="Login code" />);
    expect(screen.getByRole("group", { name: "Login code" })).toBeInTheDocument();
    unmount();

    render(
      <>
        <span id="code-heading">Code from your email</span>
        <Controlled aria-labelledby="code-heading" />
      </>,
    );
    const group = screen.getByRole("group", { name: "Code from your email" });
    expect(group).not.toHaveAttribute("aria-label");
  });

  it("announces its own error message and links it to every box", () => {
    render(<Controlled error="That code is not right" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("That code is not right");
    boxes().forEach((box) => {
      expect(box).toHaveAttribute("aria-invalid", "true");
      expect(box).toHaveAttribute("aria-describedby", alert.id);
    });
  });

  it("passes aria-describedby and aria-invalid through to every box", () => {
    render(
      <>
        <p id="outside-error">Code expired</p>
        <Controlled aria-describedby="outside-error" aria-invalid />
      </>,
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    boxes().forEach((box) => {
      expect(box).toHaveAttribute("aria-invalid", "true");
      expect(box).toHaveAccessibleDescription("Code expired");
    });
  });

  it("keeps the consumer description before its own error", () => {
    render(
      <>
        <p id="hint">Sent to your email</p>
        <Controlled aria-describedby="hint" error="Wrong code" />
      </>,
    );
    expect(boxes()[0]).toHaveAccessibleDescription("Sent to your email Wrong code");
  });

  it("is valid when neither error nor aria-invalid is set", () => {
    render(<Controlled aria-invalid="false" />);
    boxes().forEach((box) => {
      expect(box).not.toHaveAttribute("aria-invalid");
      expect(box).not.toHaveAttribute("aria-describedby");
    });
  });
});
