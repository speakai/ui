import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FileDropzone } from "../../src/components/FileDropzone";

const KB = 1024;
const file = (name: string, size: number, type = "application/pdf") =>
  new File([new Uint8Array(size)], name, { type });

function setup(props: Partial<Parameters<typeof FileDropzone>[0]> = {}) {
  const onFiles = vi.fn();
  const { container } = render(<FileDropzone onFiles={onFiles} {...props} />);
  const target = screen.getByRole("button");
  const input = container.querySelector('input[type="file"]') as HTMLInputElement;
  const choose = (...files: File[]) => {
    Object.defineProperty(input, "files", { value: files, configurable: true });
    fireEvent.change(input);
  };
  const drop = (...files: File[]) => fireEvent.drop(target, { dataTransfer: { files } });
  return { onFiles, target, input, choose, drop };
}

const names = (files: File[]) => files.map((f) => f.name);

describe("FileDropzone", () => {
  it.each(["choose", "drop"] as const)("passes every file through on %s", (how) => {
    const s = setup();
    s[how](file("a.pdf", KB), file("b.pdf", KB));
    expect(s.onFiles).toHaveBeenCalledTimes(1);
    expect(names(s.onFiles.mock.calls[0][0])).toEqual(["a.pdf", "b.pdf"]);
  });

  it("keeps only the first file when multiple is false", () => {
    const s = setup({ multiple: false });
    s.drop(file("a.pdf", KB), file("b.pdf", KB));
    expect(names(s.onFiles.mock.calls[0][0])).toEqual(["a.pdf"]);
  });

  it("uploads the files under the size limit and reports how many were too big", () => {
    const s = setup({ maxSize: 2 * KB * KB });
    s.drop(file("ok.pdf", KB), file("big1.pdf", 3 * KB * KB), file("big2.pdf", 3 * KB * KB));
    expect(names(s.onFiles.mock.calls[0][0])).toEqual(["ok.pdf"]);
    expect(screen.getByRole("alert")).toHaveTextContent("2 file(s) exceed the 2.0 MB limit");
  });

  it("does not call onFiles when every file is too big", () => {
    const s = setup({ maxSize: KB });
    s.choose(file("big.pdf", 2 * KB));
    expect(s.onFiles).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("accepts a file exactly at the size limit", () => {
    const s = setup({ maxSize: KB });
    s.choose(file("edge.pdf", KB));
    expect(names(s.onFiles.mock.calls[0][0])).toEqual(["edge.pdf"]);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("clears the size error once a valid file is chosen", () => {
    const s = setup({ maxSize: KB });
    s.choose(file("big.pdf", 2 * KB));
    s.choose(file("ok.pdf", KB));
    expect(screen.queryByRole("alert")).toBeNull();
    expect(s.target).not.toHaveAttribute("aria-describedby");
  });

  it("resets the input so the same file can be chosen again", () => {
    const s = setup();
    s.choose(file("a.pdf", KB));
    expect(s.input.value).toBe("");
  });

  it("ignores drops while disabled", () => {
    const s = setup({ disabled: true });
    s.drop(file("a.pdf", KB));
    expect(s.onFiles).not.toHaveBeenCalled();
  });

  it("opens the file picker from the keyboard", async () => {
    const user = userEvent.setup();
    const s = setup();
    const click = vi.spyOn(s.input, "click");
    s.target.focus();
    await user.keyboard("{Enter}");
    // The input sits inside the button, so its click bubbles back once; browsers ignore that nested click().
    expect(click.mock.calls.length).toBeGreaterThan(0);
  });

  it("does not open the file picker while disabled", () => {
    const s = setup({ disabled: true });
    const click = vi.spyOn(s.input, "click");
    fireEvent.click(s.target);
    expect(click).not.toHaveBeenCalled();
  });

  it("passes accept and multiple to the native picker", () => {
    const s = setup({ accept: "image/*,.pdf", multiple: false });
    expect(s.input).toHaveAttribute("accept", "image/*,.pdf");
    expect(s.input.multiple).toBe(false);
  });
  it("applies accept to dropped files by MIME type and extension, like the file picker", () => {
    const s = setup({ accept: "image/*,.PDF,text/csv" });
    s.drop(
      file("setup.exe", KB, "application/x-msdownload"),
      file("photo.png", KB, "image/png"),
      file("report.pdf", KB, "application/pdf"),
      file("data.csv", KB, "text/csv"),
    );
    expect(names(s.onFiles.mock.calls[0][0])).toEqual(["photo.png", "report.pdf", "data.csv"]);
    expect(screen.getByRole("alert")).toHaveTextContent("1 file(s) are not an accepted type");
  });

  it("does not call onFiles when no dropped file is accepted", () => {
    const s = setup({ accept: "image/*" });
    s.drop(file("setup.exe", KB, "application/x-msdownload"));
    expect(s.onFiles).not.toHaveBeenCalled();
  });

  it("accepts any dropped file when accept is not set", () => {
    const s = setup();
    s.drop(file("setup.exe", KB, "application/x-msdownload"));
    expect(names(s.onFiles.mock.calls[0][0])).toEqual(["setup.exe"]);
  });
});
