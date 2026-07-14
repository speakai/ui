import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NarrativeWidget } from "../../../src/components/dashboards/narrative-widget";

const LABELS = {
  title: "Summary",
  emptyTitle: "No summary yet",
  emptyDescription: "Generate a summary of this dashboard.",
  generate: "Generate summary",
  generatedAtCaption: "Generated on Jul 13, 2026",
  staleTitle: "Summary out of date",
  staleDescription: "The data changed since this was generated.",
};

describe("NarrativeWidget", () => {
  it("renders HTML in LLM output as literal text, never markup", () => {
    const payload = 'Before <img src=x onerror=alert(1)> after\n\n<script>alert(2)</script>';
    const { container } = render(<NarrativeWidget text={payload} labels={LABELS} />);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<img src=x onerror=alert(1)>");
    expect(container.textContent).toContain("<script>alert(2)</script>");
  });

  it("splits on blank lines into paragraphs and shows the caption", () => {
    const { container } = render(
      <NarrativeWidget text={"First paragraph.\n\nSecond paragraph."} labels={LABELS} />,
    );
    const paragraphs = Array.from(container.querySelectorAll("p")).map(
      (p) => p.textContent,
    );
    expect(paragraphs).toContain("First paragraph.");
    expect(paragraphs).toContain("Second paragraph.");
    expect(screen.getByText("Generated on Jul 13, 2026")).toBeInTheDocument();
  });

  it("shows the empty state without a generate button when onGenerate is absent", () => {
    render(<NarrativeWidget labels={LABELS} />);
    expect(screen.getByText("No summary yet")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("shows the generate button when onGenerate is provided and fires it", async () => {
    const user = userEvent.setup();
    const onGenerate = vi.fn();
    render(<NarrativeWidget labels={LABELS} onGenerate={onGenerate} />);
    await user.click(screen.getByRole("button", { name: /generate summary/i }));
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("disables the generate button while generating", () => {
    render(<NarrativeWidget labels={LABELS} onGenerate={() => {}} isGenerating />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("hides the text and shows the stale empty state when isStale", () => {
    render(
      <NarrativeWidget
        text="Old narrative body"
        isStale
        labels={LABELS}
        onGenerate={() => {}}
      />,
    );
    expect(screen.queryByText("Old narrative body")).toBeNull();
    expect(screen.getByText("Summary out of date")).toBeInTheDocument();
    expect(
      screen.getByText("The data changed since this was generated."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /generate summary/i })).toBeInTheDocument();
  });
});
