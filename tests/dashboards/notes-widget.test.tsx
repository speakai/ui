import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { NotesWidget } from "../../src/components/dashboards/notes-widget";

const labels = { emptyTitle: "Empty" };
const renderNotes = (content: string) => render(<NotesWidget config={{ content }} labels={labels} />);

describe("NotesWidget links", () => {
  it("renders a bare URL as a safe new-tab anchor", () => {
    renderNotes("See https://example.com/page for details");
    const link = screen.getByRole("link", { name: "https://example.com/page" });
    expect(link).toHaveAttribute("href", "https://example.com/page");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows markdown link text and hides the URL", () => {
    renderNotes("Read [the guide](https://example.com/guide) now");
    const link = screen.getByRole("link", { name: "the guide" });
    expect(link).toHaveAttribute("href", "https://example.com/guide");
    expect(screen.queryByText(/\]\(/)).toBeNull();
  });

  it("does not link javascript: or data: schemes", () => {
    renderNotes("[x](javascript:alert(1)) [y](data:text/html,hi) javascript:alert(1)");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("leaves plain text unchanged", () => {
    const { container } = renderNotes("Line one\nLine two, no links.");
    expect(container.querySelector("p")?.textContent).toBe("Line one\nLine two, no links.");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("keeps trailing punctuation out of the URL", () => {
    const { container } = renderNotes("Go to https://example.com/a, then (https://example.com/b). Done!");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(["https://example.com/a", "https://example.com/b"]);
    expect(container.querySelector("p")?.textContent).toBe(
      "Go to https://example.com/a, then (https://example.com/b). Done!",
    );
  });
});
