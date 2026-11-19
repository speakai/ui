import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  it("renders the message with the contrast-safe danger text token", () => {
    render(<FieldError id="email-error">Email is required</FieldError>);
    const el = screen.getByText("Email is required");
    expect(el.tagName).toBe("P");
    expect(el).toHaveAttribute("id", "email-error");
    expect(el).toHaveClass("text-danger-text");
    expect(el).not.toHaveAttribute("role");
  });

  it("passes role through", () => {
    render(<FieldError role="alert">Wrong code</FieldError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Wrong code");
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
    expect(error).toHaveClass("text-danger-text");
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

  it("does not point Checkbox at an error it does not render (no label or description)", () => {
    render(<Checkbox aria-label="Terms" error="You must accept" />);
    expect(screen.getByLabelText("Terms")).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByText("You must accept")).toBeNull();
  });

  it("OTPInput keeps role=alert on its error", () => {
    render(<OTPInput value="12" onChange={noop} error="Wrong code" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Wrong code");
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
    expect(target).toHaveAttribute("aria-describedby", error.id);
  });
});

describe("ImageUploader", () => {
  const MB = 1024 * 1024;
  const image = (size: number) => new File([new Uint8Array(size)], "photo.png", { type: "image/png" });
  const originalCreateObjectURL = URL.createObjectURL;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:preview");
  });
  afterEach(() => {
    URL.createObjectURL = originalCreateObjectURL;
  });

  function setup(props: Partial<Parameters<typeof ImageUploader>[0]> = {}) {
    const onChange = vi.fn();
    const onRemove = vi.fn();
    const { container } = render(<ImageUploader onChange={onChange} onRemove={onRemove} {...props} />);
    const target = container.querySelector('[role="button"]') as HTMLElement;
    const drop = (...files: File[]) => fireEvent.drop(target, { dataTransfer: { files } });
    return { onChange, onRemove, drop };
  }

  it("emits the dropped image and shows its preview", () => {
    const s = setup();
    const file = image(1024);
    s.drop(file);
    expect(s.onChange).toHaveBeenCalledWith(file);
    expect(screen.getByAltText("Preview")).toHaveAttribute("src", "blob:preview");
  });

  it("emits only the first image when several are dropped", () => {
    const s = setup();
    const first = image(1024);
    s.drop(first, image(2048));
    expect(s.onChange).toHaveBeenCalledTimes(1);
    expect(s.onChange).toHaveBeenCalledWith(first);
  });

  it("rejects images over the 10 MB default limit without emitting or previewing", () => {
    const s = setup();
    s.drop(image(10 * MB + 1));
    expect(s.onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("File exceeds 10.0 MB limit");
    expect(screen.queryByAltText("Preview")).toBeNull();
  });

  it("ignores drops while disabled", () => {
    const s = setup({ disabled: true });
    s.drop(image(1024));
    expect(s.onChange).not.toHaveBeenCalled();
  });

  it("removes the preview on remove", async () => {
    const user = userEvent.setup();
    const s = setup();
    s.drop(image(1024));
    await user.click(screen.getByRole("button", { name: "Remove image" }));
    expect(s.onRemove).toHaveBeenCalledTimes(1);
    expect(screen.queryByAltText("Preview")).toBeNull();
  });

  it("hides the remove button while disabled so a locked image cannot be cleared", () => {
    render(<ImageUploader onChange={vi.fn()} value="https://example.com/a.png" disabled />);
    expect(screen.getByAltText("Preview")).toHaveAttribute("src", "https://example.com/a.png");
    expect(screen.queryByRole("button", { name: "Remove image" })).toBeNull();
  });
});
