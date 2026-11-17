import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { Input, Select, Textarea } from "../../src/components/Input";
import { FieldError } from "../../src/components/FieldError";
import { PasswordInput } from "../../src/components/PasswordInput";
import { PhoneInput } from "../../src/components/PhoneInput";
import { DatePicker } from "../../src/components/DatePicker";
import { TimePicker } from "../../src/components/TimePicker";
import { LanguageSelector } from "../../src/components/LanguageSelector";
import { Checkbox } from "../../src/components/Checkbox";
import { OTPInput } from "../../src/components/OTPInput";
import { FileDropzone } from "../../src/components/FileDropzone";
import { ImageUploader } from "../../src/components/ImageUploader";
import { FieldError as FieldErrorFromEntry } from "../../src/entries/field-error";
import { FieldError as FieldErrorFromBarrel } from "../../src/index";

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

const noop = () => {};

describe("FieldError", () => {
  it("renders the message with the danger text token and the base spacing", () => {
    render(<FieldError id="email-error">Email is required</FieldError>);
    const el = screen.getByText("Email is required");
    expect(el.tagName).toBe("P");
    expect(el).toHaveAttribute("id", "email-error");
    expect(el).toHaveClass("mt-1.5", "text-xs", "text-danger-text");
    expect(el).not.toHaveAttribute("role");
  });

  it("passes role through", () => {
    render(<FieldError role="alert">Wrong code</FieldError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Wrong code");
  });

  it("lets className override the spacing", () => {
    render(<FieldError className="mt-1">Needed</FieldError>);
    const el = screen.getByText("Needed");
    expect(el).toHaveClass("mt-1", "text-danger-text");
    expect(el).not.toHaveClass("mt-1.5");
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["false", false],
    ["an empty string", ""],
  ])("renders nothing for %s", (_name, value) => {
    const { container } = render(<FieldError id="x">{value}</FieldError>);
    expect(container).toBeEmptyDOMElement();
  });

  it("is exported from its sub-path and the barrel", () => {
    expect(FieldErrorFromEntry).toBe(FieldError);
    expect(FieldErrorFromBarrel).toBe(FieldError);
  });
});

const describedCases: Array<[string, ReactElement, () => HTMLElement]> = [
  ["Input", <Input aria-label="Email" error="Bad email" />, () => screen.getByLabelText("Email")],
  ["Select", <Select aria-label="Plan" error="Pick a plan" options={[]} />, () => screen.getByLabelText("Plan")],
  ["Textarea", <Textarea aria-label="Notes" error="Too short" />, () => screen.getByLabelText("Notes")],
  ["PasswordInput", <PasswordInput id="pw" label="Password" error="Too weak" />, () => screen.getByLabelText("Password")],
  ["PhoneInput", <PhoneInput value="" onChange={noop} error="Bad number" />, () => screen.getByPlaceholderText("Phone number")],
  ["DatePicker", <DatePicker label="Start" onChange={noop} error="Pick a date" />, () => screen.getByLabelText("Start")],
  ["TimePicker", <TimePicker label="At" onChange={noop} error="Pick a time" />, () => screen.getByLabelText("At")],
  [
    "LanguageSelector",
    <LanguageSelector value="" onChange={noop} languages={[{ code: "en", name: "English" }]} error="Pick a language" />,
    () => screen.getByRole("button", { name: /select language/i }),
  ],
  ["Checkbox", <Checkbox label="Terms" error="You must accept" />, () => screen.getByLabelText("Terms")],
];

describe("form components wire aria-describedby to FieldError", () => {
  it.each(describedCases)("%s", (_name, ui, getControl) => {
    render(ui);
    const id = getControl().getAttribute("aria-describedby");
    expect(id).toBeTruthy();
    const error = document.getElementById(id!);
    expect(error).not.toBeNull();
    expect(error!.tagName).toBe("P");
    expect(error).toHaveClass("text-xs", "text-danger-text");
  });

  it("keeps the consumer's aria-describedby before the error id", () => {
    render(
      <>
        <p id="hint">Use your work email</p>
        <Input aria-label="Email" aria-describedby="hint" error="Bad email" />
      </>,
    );
    const ids = screen.getByLabelText("Email").getAttribute("aria-describedby")!.split(" ");
    expect(ids[0]).toBe("hint");
    expect(document.getElementById(ids[1])).toHaveTextContent("Bad email");
  });

  it("adds no aria-describedby when error is a boolean", () => {
    render(<Input aria-label="Email" error />);
    expect(screen.getByLabelText("Email")).not.toHaveAttribute("aria-describedby");
  });

  it("keeps Checkbox's tighter spacing", () => {
    render(<Checkbox label="Terms" error="You must accept" />);
    expect(screen.getByText("You must accept")).toHaveClass("mt-1");
    expect(screen.getByText("You must accept")).not.toHaveClass("mt-1.5");
  });

  it("does not point Checkbox at an error it does not render (no label or description)", () => {
    render(<Checkbox aria-label="Terms" error="You must accept" />);
    expect(screen.getByLabelText("Terms")).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("You must accept")).toBeNull();
  });

  it("OTPInput keeps role=alert on its error", () => {
    render(<OTPInput value="12" onChange={noop} error="Wrong code" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass("text-danger-text");
    for (const box of screen.getAllByRole("textbox")) {
      expect(box).toHaveAttribute("aria-describedby", alert.id);
    }
  });

  it.each([
    ["FileDropzone", <FileDropzone onFiles={vi.fn()} maxSize={1024} />, /exceed the 0\.0 MB limit/],
    ["ImageUploader", <ImageUploader onChange={vi.fn()} maxSize={1024} />, /File exceeds 0\.0 MB limit/],
  ])("%s announces the size error and points its drop target at it", (_name, ui, message) => {
    const { container } = render(ui);
    const target = container.querySelector('[role="button"]') as HTMLElement;
    expect(target).not.toHaveAttribute("aria-describedby");

    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File([new Uint8Array(4096)], "big.png", { type: "image/png" });
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    fireEvent.change(input);

    const error = screen.getByText(message);
    expect(error).toHaveAttribute("role", "alert");
    expect(error).toHaveClass("mt-1.5", "text-xs", "text-danger-text");
    expect(target).toHaveAttribute("aria-describedby", error.id);
  });
});
