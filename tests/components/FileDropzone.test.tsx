import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { FileDropzone } from "../../src/components/FileDropzone";

const file = (name: string, type: string) => new File(["x"], name, { type });

function drop(target: HTMLElement, files: File[]) {
  fireEvent.drop(target, { dataTransfer: { files } });
}

describe("FileDropzone drag and drop", () => {
  it("applies accept to dropped files by MIME type and extension, like the file picker", () => {
    const onFiles = vi.fn();
    render(<FileDropzone onFiles={onFiles} accept="image/*,.PDF,text/csv" />);
    const pdf = file("report.pdf", "application/pdf");
    const png = file("photo.png", "image/png");
    const csv = file("data.csv", "text/csv");

    drop(screen.getByRole("button"), [file("setup.exe", "application/x-msdownload"), png, pdf, csv]);

    expect(onFiles).toHaveBeenCalledWith([png, pdf, csv]);
    expect(screen.getByRole("alert")).toHaveTextContent("1 file(s) are not an accepted type");
  });

  it("does not call onFiles when no dropped file is accepted", () => {
    const onFiles = vi.fn();
    render(<FileDropzone onFiles={onFiles} accept="image/*" />);
    drop(screen.getByRole("button"), [file("setup.exe", "application/x-msdownload")]);
    expect(onFiles).not.toHaveBeenCalled();
  });

  it("accepts any dropped file when accept is not set", () => {
    const onFiles = vi.fn();
    render(<FileDropzone onFiles={onFiles} />);
    const exe = file("setup.exe", "application/x-msdownload");
    drop(screen.getByRole("button"), [exe]);
    expect(onFiles).toHaveBeenCalledWith([exe]);
  });
});
