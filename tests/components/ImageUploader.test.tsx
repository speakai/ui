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
});
