import { describe, it, expect } from "vitest";
import { act, fireEvent, render } from "@testing-library/react";
import { SessionCardGrid, type SessionCardData } from "../../src/components/dashboards/session-cards";

const card = (n: number, extra: Partial<SessionCardData> = {}): SessionCardData => ({
  key: `k${n}`,
  mediaId: `m${n}`,
  mediaType: "video",
  mediaUrl: `https://media.example/${n}.mp4`,
  title: `Session ${n}`,
  subtitles: [],
  details: [],
  ...extra,
});

const renderGrid = (cards: SessionCardData[]) =>
  render(<SessionCardGrid cards={cards} clickable={false} />);

describe("SessionCardGrid posters", () => {
  it("renders a lazy thumbnail image and no video when thumbnailUrl is set", () => {
    const { container } = renderGrid([card(1, { thumbnailUrl: "https://media.example/1.jpg" })]);
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("https://media.example/1.jpg");
    expect(img?.getAttribute("loading")).toBe("lazy");
    expect(img?.getAttribute("decoding")).toBe("async");
    expect(img?.getAttribute("alt")).toBe("");
    expect(container.querySelector("video")).toBeNull();
    expect(img?.className).toContain("opacity-0");
    fireEvent.load(img as HTMLImageElement);
    expect(img?.className).toContain("opacity-100");
  });

  it("falls back to the video frame when the thumbnail errors", () => {
    const { container } = renderGrid([card(1, { thumbnailUrl: "https://media.example/bad.jpg" })]);
    fireEvent.error(container.querySelector("img") as HTMLImageElement);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("video")?.getAttribute("src")).toBe("https://media.example/1.mp4#t=3");
  });

  it("loads at most two video frames at once and frees a slot on loadeddata or error", () => {
    const { container } = renderGrid([card(1), card(2), card(3), card(4)]);
    const videos = () => Array.from(container.querySelectorAll("video"));
    expect(videos()).toHaveLength(2);

    act(() => {
      fireEvent.loadedData(videos()[0]);
    });
    expect(videos()).toHaveLength(3);

    act(() => {
      fireEvent.error(videos()[1]);
    });
    expect(videos().map((v) => v.getAttribute("src"))).toContain("https://media.example/4.mp4#t=3");
  });

  it("frees the slot when a loading card unmounts", () => {
    const first = renderGrid([card(1), card(2)]);
    expect(first.container.querySelectorAll("video")).toHaveLength(2);
    const second = renderGrid([card(3)]);
    expect(second.container.querySelectorAll("video")).toHaveLength(0);
    first.unmount();
    expect(second.container.querySelectorAll("video")).toHaveLength(1);
  });
});
