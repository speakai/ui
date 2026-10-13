import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TableWidget, type TableWidgetData } from "../../../src/components/dashboards/table-widget";
import { NotesWidget, type NotesAction } from "../../../src/components/dashboards/notes-widget";
import { formatClockDuration } from "../../../src/components/dashboards/session-cards";

const LABELS = {
  title: "Sessions",
  empty: "No sessions",
  error: "Could not load",
  searchPlaceholder: "Search sessions",
  nameHeader: "Name",
};

const DATA: TableWidgetData = {
  columns: [{ header: "Speaker" }, { header: "Room" }, { header: "Track" }],
  rows: [
    { name: "Opening keynote", mediaId: "m1", mediaType: "video", durationSec: 3725, cells: ["Ada", "Hall A", "Strategy"] },
    { name: "Podcast live", mediaId: "m2", mediaType: "audio", durationSec: 600, cells: ["Grace", "Hall B", null] },
    { name: "Closing panel", mediaId: "m3", mediaType: "video", cells: ["Linus", "Hall A", "Close"] },
  ],
  total: 3,
};

const CARD_CONFIG = {
  display: "cards" as const,
  rowClick: "openMedia" as const,
  searchable: true,
  card: { subtitleColumns: ["Speaker"], detailColumns: ["Room", "Track"] },
};

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;
let observers: Array<{ cb: ObserverCallback; node: Element | null; disconnect: ReturnType<typeof vi.fn> }>;

beforeEach(() => {
  observers = [];
  class FakeObserver {
    entry: (typeof observers)[number];
    constructor(cb: ObserverCallback) {
      this.entry = { cb, node: null, disconnect: vi.fn() };
      observers.push(this.entry);
    }
    observe(node: Element) {
      this.entry.node = node;
    }
    disconnect() {
      this.entry.disconnect();
    }
    unobserve() {}
    takeRecords() {
      return [];
    }
  }
  vi.stubGlobal("IntersectionObserver", FakeObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const scrollIntoView = (index: number) =>
  act(() => {
    observers[index]?.cb([{ isIntersecting: true }]);
  });

function renderCards(overrides: Partial<React.ComponentProps<typeof TableWidget>> = {}) {
  return render(
    <TableWidget data={DATA} isLoading={false} isError={false} config={CARD_CONFIG} labels={LABELS} {...overrides} />,
  );
}

describe("formatClockDuration", () => {
  it("formats minutes and hours", () => {
    expect(formatClockDuration(245)).toBe("4:05");
    expect(formatClockDuration(3725)).toBe("1:02:05");
    expect(formatClockDuration(-3)).toBe("0:00");
  });
});

describe("TableWidget cards", () => {
  it("renders cards instead of a table with title, speaker, details and duration", () => {
    const { container } = renderCards();
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByRole("heading", { name: "Opening keynote" })).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getAllByText("Hall A")).toHaveLength(2);
    expect(screen.getByText("Strategy")).toBeInTheDocument();
    expect(screen.getByText("1:02:05")).toBeInTheDocument();
  });

  it("keeps the table when display is not cards", () => {
    const { container } = renderCards({ config: { ...CARD_CONFIG, display: "table" } });
    expect(container.querySelector("table")).not.toBeNull();
  });

  it("opens the media when a card is clicked", async () => {
    const onRowClick = vi.fn();
    renderCards({ onRowClick });
    await userEvent.click(screen.getByRole("button", { name: /Opening keynote/ }));
    expect(onRowClick).toHaveBeenCalledWith("m1");
  });

  it("renders plain, non-clickable cards when row click is off", () => {
    renderCards({ config: { ...CARD_CONFIG, rowClick: "none" } });
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("heading", { name: "Opening keynote" })).toBeInTheDocument();
  });

  it("filters cards with the search box exactly as it filters rows", async () => {
    renderCards();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search sessions" }), "grace");
    expect(screen.getByRole("heading", { name: "Podcast live" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Opening keynote" })).toBeNull();
  });

  it("shows the empty text when search matches nothing", async () => {
    renderCards();
    await userEvent.type(screen.getByRole("searchbox", { name: "Search sessions" }), "zzz");
    expect(screen.getByText("No sessions")).toBeInTheDocument();
  });

  it("falls back to the first columns as details when no card config is given", () => {
    renderCards({ config: { display: "cards", rowClick: "openMedia" } });
    expect(screen.getByText("Ada")).toBeInTheDocument();
    expect(screen.getAllByText("Hall A")).toHaveLength(2);
    expect(screen.queryByText("Strategy")).toBeNull();
  });

  it("uses a configured title column over the media name", () => {
    renderCards({ config: { ...CARD_CONFIG, card: { titleColumn: "Speaker" } } });
    expect(screen.getByRole("heading", { name: "Ada" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Opening keynote" })).toBeNull();
  });

  it("hides the duration badge when showDuration is false", () => {
    renderCards({ config: { ...CARD_CONFIG, card: { ...CARD_CONFIG.card, showDuration: false } } });
    expect(screen.queryByText("1:02:05")).toBeNull();
  });
});

describe("session card poster", () => {
  it("does not ask for a URL until the card scrolls into view", async () => {
    const resolvePosterUrl = vi.fn().mockResolvedValue("https://media.example/m1.mp4");
    renderCards({ resolvePosterUrl });
    expect(resolvePosterUrl).not.toHaveBeenCalled();

    scrollIntoView(0);
    await waitFor(() => expect(resolvePosterUrl).toHaveBeenCalledWith("m1"));
    expect(resolvePosterUrl).toHaveBeenCalledTimes(1);
  });

  it("loads the video metadata a few seconds in and reveals it once a frame is ready", async () => {
    const resolvePosterUrl = vi.fn().mockResolvedValue("https://media.example/m1.mp4");
    const { container } = renderCards({ resolvePosterUrl });
    scrollIntoView(0);

    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe("https://media.example/m1.mp4#t=3");
    expect(video.getAttribute("preload")).toBe("metadata");
    expect(video.muted).toBe(true);
    expect(video.className).toContain("opacity-0");

    fireEvent.loadedData(video);
    expect(video.className).toContain("opacity-100");
  });

  it("shows the audio placeholder and never requests a URL for audio-only media", () => {
    const resolvePosterUrl = vi.fn().mockResolvedValue("https://media.example/m2.mp3");
    renderCards({ resolvePosterUrl });
    scrollIntoView(1);
    expect(resolvePosterUrl).not.toHaveBeenCalledWith("m2");
    expect(screen.getByText("Audio")).toBeInTheDocument();
  });

  it("falls back to the placeholder when the URL cannot be resolved", async () => {
    const resolvePosterUrl = vi.fn().mockRejectedValue(new Error("nope"));
    const { container } = renderCards({ resolvePosterUrl });
    scrollIntoView(0);
    await waitFor(() => expect(resolvePosterUrl).toHaveBeenCalled());
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByRole("heading", { name: "Opening keynote" })).toBeInTheDocument();
  });

  it("drops the video when the browser cannot play it", async () => {
    const resolvePosterUrl = vi.fn().mockResolvedValue("https://media.example/m1.mp4");
    const { container } = renderCards({ resolvePosterUrl });
    scrollIntoView(0);
    await waitFor(() => expect(container.querySelector("video")).not.toBeNull());
    fireEvent.error(container.querySelector("video") as HTMLVideoElement);
    await waitFor(() => expect(container.querySelector("video")).toBeNull());
  });
});

describe("NotesWidget actions", () => {
  const config = {
    content: "Welcome",
    actions: [
      { label: "Ask a question", action: "openChat" as const },
      { label: "Watch sessions", action: "goToSection" as const, sectionId: "sessions" },
    ],
  };

  it("renders a button per action and reports the pressed one", async () => {
    const onAction = vi.fn();
    render(<NotesWidget config={config} labels={{ emptyTitle: "Empty" }} onAction={onAction} />);
    await userEvent.click(screen.getByRole("button", { name: "Watch sessions" }));
    expect(onAction).toHaveBeenCalledWith({ label: "Watch sessions", action: "goToSection", sectionId: "sessions" });
    expect(screen.getByRole("button", { name: "Ask a question" })).toBeInTheDocument();
  });

  it("shows actions without heading or content and skips actions with no label", () => {
    const actionsOnly = {
      actions: [{ action: "openChat" } as NotesAction, { label: "Ask a question", action: "openChat" as const }],
    };
    render(<NotesWidget config={actionsOnly} labels={{ emptyTitle: "Empty" }} onAction={vi.fn()} />);
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Ask a question" })).toBeInTheDocument();
    expect(screen.queryByText("Empty")).toBeNull();
  });

  it("renders no buttons when the host does not handle actions", () => {
    render(<NotesWidget config={config} labels={{ emptyTitle: "Empty" }} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
