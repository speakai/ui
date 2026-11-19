import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ImageUploader } from "../../src/components/ImageUploader";

describe("ImageUploader drag and drop", () => {
  it("rejects a dropped file that does not match accept and makes no preview", () => {
    const onChange = vi.fn();
    const createObjectURL = vi.fn(() => "blob:preview");
    URL.createObjectURL = createObjectURL; // jsdom has no createObjectURL
    render(<ImageUploader onChange={onChange} />);

    fireEvent.drop(screen.getByRole("button"), {
      dataTransfer: { files: [new File(["x"], "setup.exe", { type: "application/x-msdownload" })] },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("File type is not accepted");

    const png = new File(["x"], "photo.png", { type: "image/png" });
    fireEvent.drop(screen.getByRole("button"), { dataTransfer: { files: [png] } });
    expect(onChange).toHaveBeenCalledWith(png);
  });

  it("shows the caller's labels for a wrong type and a too-large file", () => {
    const onChange = vi.fn();
    render(
      <ImageUploader
        onChange={onChange}
        maxSize={1024 * 1024}
        labels={{
          invalidType: (count) => `wrong type: ${count}`,
          tooLarge: (count, limit) => `too big: ${count} over ${limit}`,
        }}
      />,
    );
    const target = screen.getByRole("button");

    fireEvent.drop(target, { dataTransfer: { files: [new File(["x"], "a.exe", { type: "application/x-msdownload" })] } });
    expect(screen.getByRole("alert")).toHaveTextContent("wrong type: 1");

    const big = new File([new Uint8Array(2 * 1024 * 1024)], "big.png", { type: "image/png" });
    fireEvent.drop(target, { dataTransfer: { files: [big] } });
    expect(screen.getByRole("alert")).toHaveTextContent("too big: 1 over 1.0 MB");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("keeps the English size text when no labels are given", () => {
    render(<ImageUploader onChange={vi.fn()} maxSize={1024 * 1024} />);
    const big = new File([new Uint8Array(2 * 1024 * 1024)], "big.png", { type: "image/png" });
    fireEvent.drop(screen.getByRole("button"), { dataTransfer: { files: [big] } });
    expect(screen.getByRole("alert")).toHaveTextContent("File exceeds 1.0 MB limit");
  });
});
