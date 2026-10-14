import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SessionCardGrid,
  type SessionCardData,
} from "../../../src/components/dashboards/session-cards";

const card = (extra: Partial<SessionCardData> = {}): SessionCardData => ({
  key: "c1",
  title: "Opening keynote",
  subtitles: ["Health"],
  details: [],
  ...extra,
});

describe("SessionCardGrid avatar", () => {
  it("renders a lazy no-referrer circle next to the topic when avatarSrc is set", () => {
    const { container } = render(
      <SessionCardGrid
        cards={[card({ avatarSrc: "https://photos.example/alex.jpg", avatarName: "Alex Rivera" })]}
        clickable={false}
      />,
    );
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("https://photos.example/alex.jpg");
    expect(img.getAttribute("alt")).toBe("Alex Rivera");
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(img.closest(".rounded-full")).not.toBeNull();
    expect(screen.getByText("Health")).toBeInTheDocument();
  });

  it("renders no avatar without avatarSrc", () => {
    const { container } = render(<SessionCardGrid cards={[card()]} clickable={false} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
