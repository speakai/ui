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

describe("NotesWidget markdown", () => {
  it("renders # ## ### as h1 h2 h3", () => {
    renderNotes("# One\n\n## Two\n\n### Three");
    expect(screen.getByRole("heading", { level: 1, name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Two" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Three" })).toBeInTheDocument();
  });

  it("renders bold, italic and inline code", () => {
    const { container } = renderNotes("A **bold** and *slanted* and `code` word");
    expect(container.querySelector("strong")?.textContent).toBe("bold");
    expect(container.querySelector("em")?.textContent).toBe("slanted");
    expect(container.querySelector("code")?.textContent).toBe("code");
    expect(container.textContent).not.toMatch(/[*`]/);
  });

  it("renders an ordered list with three items", () => {
    const { container } = renderNotes("1. First\n2. Second\n3. Third");
    expect(container.querySelectorAll("ol > li")).toHaveLength(3);
  });

  it("renders unordered lists with one nested level, quotes and rules", () => {
    const { container } = renderNotes("- a\n  - a1\n- b\n\n> quoted\n\n---");
    expect(container.querySelectorAll("ul > li")).toHaveLength(3);
    expect(container.querySelectorAll("ul ul")).toHaveLength(1);
    expect(container.querySelector("blockquote")?.textContent).toBe("quoted");
    expect(container.querySelector("hr")).not.toBeNull();
  });

  it("keeps bare URLs and markdown links as safe anchors", () => {
    renderNotes("**See** https://example.com/a and [guide](https://example.com/b)");
    const links = screen.getAllByRole("link");
    expect(links.map((a) => a.getAttribute("href"))).toEqual(["https://example.com/a", "https://example.com/b"]);
    links.forEach((a) => expect(a).toHaveAttribute("rel", "noopener noreferrer"));
  });

  it("renders a simple table", () => {
    const { container } = renderNotes("| Name | Value |\n| --- | --- |\n| Alpha | 1 |\n| Beta | 2 |");
    expect(container.querySelectorAll("th")).toHaveLength(2);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(screen.getByText("Beta")).toBeInTheDocument();
  });

  it("shows script and img tags as text and adds no elements", () => {
    const html = '<script>alert(1)</script> <img src=x onerror="alert(1)">';
    const { container } = renderNotes(html);
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("img")).toBeNull();
    expect(container.textContent).toContain(html);
  });

  it("does not link javascript: markdown links", () => {
    renderNotes("[click](javascript:alert(1))");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("keeps multi-line plain text as one paragraph with line breaks", () => {
    const { container } = renderNotes("Line one\nLine two");
    expect(container.querySelectorAll("p")).toHaveLength(1);
    expect(container.querySelector("p")?.textContent).toBe("Line one\nLine two");
  });
});
