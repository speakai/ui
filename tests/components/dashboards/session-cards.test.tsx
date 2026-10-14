import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionCardGrid, getTitleInitials, type SessionCardData } from "../../../src/components/dashboards/session-cards";

const card = (over: Partial<SessionCardData> = {}): SessionCardData => ({
  key: "k1",
  mediaId: "m1",
  mediaType: "video",
  mediaUrl: "https://media.example.com/v.mp4",
  durationSec: 125,
  title: "Quarterly planning review",
  subtitles: ["Planning", "Alex Doe"],
  details: ["Key takeaway"],
  ...over,
});

describe("getTitleInitials", () => {
  it("takes the first letter of the first two words, uppercased", () => {
    expect(getTitleInitials("quarterly planning review")).toBe("QP");
  });

  it("handles one word, punctuation, digits and non-latin letters", () => {
    expect(getTitleInitials("Intro")).toBe("I");
    expect(getTitleInitials("  -- (draft) 2nd round")).toBe("D2");
    expect(getTitleInitials("événement été")).toBe("ÉÉ");
  });

  it("returns empty for a title with no letters or digits", () => {
    expect(getTitleInitials("— …")).toBe("");
    expect(getTitleInitials("")).toBe("");
  });
});

describe("SessionCardGrid brand styling", () => {
  it("renders the topic chip with the brand primary tokens, not gray", () => {
    render(<SessionCardGrid cards={[card()]} clickable />);
    const chip = screen.getByText("Planning").closest("span.inline-flex") as HTMLElement;
    expect(chip.className).toContain("text-primary");
    expect(chip.className).toContain("bg-primary/10");
    expect(chip.className).not.toContain("bg-muted");
  });

  it("renders the play button with the brand primary background", () => {
    const { container } = render(<SessionCardGrid cards={[card()]} clickable />);
    const play = container.querySelector("span.rounded-full.bg-primary");
    expect(play).not.toBeNull();
    expect(play?.className).toContain("text-primary-foreground");
  });

  it("guards the hover lift and play scale for reduced motion", () => {
    const { container } = render(<SessionCardGrid cards={[card()]} clickable />);
    const article = container.querySelector("article") as HTMLElement;
    expect(article.className).toContain("hover:-translate-y-0.5");
    expect(article.className).toContain("motion-reduce:hover:translate-y-0");
    expect(article.className).toContain("motion-reduce:transition-none");
    expect(container.querySelector("span.bg-primary")?.className).toContain("motion-reduce:group-hover:scale-100");
  });

  it("does not lift a card that is not clickable", () => {
    const { container } = render(<SessionCardGrid cards={[card()]} clickable={false} />);
    expect((container.querySelector("article") as HTMLElement).className).not.toContain("hover:-translate-y-0.5");
  });
});

describe("SessionCardGrid fallback poster", () => {
  it("shows the title initials, hidden from assistive tech, until a frame loads", () => {
    const { container } = render(<SessionCardGrid cards={[card({ mediaUrl: undefined })]} clickable />);
    const initials = screen.getByText("QP");
    expect(initials).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".from-primary\\/30")).not.toBeNull();
  });

  it("keeps the audio label for audio-only sessions", () => {
    render(<SessionCardGrid cards={[card({ mediaType: "audio", mediaUrl: undefined })]} clickable audioOnlyLabel="Audio only" />);
    expect(screen.getByText("Audio only")).toBeInTheDocument();
    expect(screen.queryByText("QP")).toBeNull();
  });
});

describe("SessionCardGrid accessibility", () => {
  it("opens the session from a keyboard-focusable button named by the title", async () => {
    const onOpen = vi.fn();
    render(<SessionCardGrid cards={[card()]} clickable onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Quarterly planning review" });
    expect(button.className).toContain("focus-visible:ring-primary");
    await userEvent.tab();
    expect(button).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onOpen).toHaveBeenCalledWith("m1");
  });
});
