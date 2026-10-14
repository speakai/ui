import { describe, it, expect, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TableWidget,
  type TableWidgetData,
} from "../../../src/components/dashboards/table-widget";

const LABELS = {
  title: "Media table",
  empty: "No rows",
  emptyDescription: "Nothing matched.",
  error: "Could not load table",
  retry: "Retry",
  searchPlaceholder: "Search rows",
  nameHeader: "Name",
  totalCaption: "3 items total",
};

const DATA: TableWidgetData = {
  columns: [
    {
      header: "Score",
      format: "number",
      thresholds: [
        { when: { op: "gte", value: 90 }, status: "good", label: "Great" },
        { when: { op: "lt", value: 50 }, status: "critical" },
      ],
    },
    { header: "Duration", format: "duration" },
  ],
  rows: [
    { name: "Alpha", mediaId: "m1", cells: [95, 120] },
    { name: "Bravo", mediaId: "m2", cells: [40, 3700] },
    { name: "Charlie", cells: [70, 60] },
  ],
  total: 3,
};

function dataRows(container: HTMLElement): HTMLElement[] {
  const tbody = container.querySelector("tbody") as HTMLElement;
  return Array.from(tbody.querySelectorAll("tr")) as HTMLElement[];
}

describe("TableWidget", () => {
  it("renders headers, name column, and formatted rows", () => {
    render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
      />,
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Score")).toBeInTheDocument();
    expect(screen.getByText("Duration")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    // duration column formats 3700s → "1h 1m"
    expect(screen.getByText("1h 1m")).toBeInTheDocument();
    expect(screen.getByText("3 items total")).toBeInTheDocument();
  });

  it("omits the name column when no row carries a name", () => {
    render(
      <TableWidget
        data={{
          columns: [{ header: "Score" }],
          rows: [{ cells: [1] }],
          total: 1,
        }}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
      />,
    );
    expect(screen.queryByText("Name")).toBeNull();
  });

  it("sorts by a numeric column when its header is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
      />,
    );
    await user.click(screen.getByText("Score"));
    let names = dataRows(container).map(
      (row) => row.querySelector("td")?.textContent,
    );
    expect(names).toEqual(["Bravo", "Charlie", "Alpha"]); // 40, 70, 95 asc

    await user.click(screen.getByText("Score"));
    names = dataRows(container).map((row) => row.querySelector("td")?.textContent);
    expect(names).toEqual(["Alpha", "Charlie", "Bravo"]); // 95, 70, 40 desc
  });

  it("applies the initial sort from config matched by header", () => {
    const { container } = render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{ sort: { column: "Score", dir: "desc" } }}
        labels={LABELS}
      />,
    );
    const names = dataRows(container).map(
      (row) => row.querySelector("td")?.textContent,
    );
    expect(names).toEqual(["Alpha", "Charlie", "Bravo"]);
  });

  it("reflects config sort on the header and row order when data loads after first paint", () => {
    // Simulates the real async query: first render has no data, data arrives later.
    const { container, rerender } = render(
      <TableWidget
        data={undefined}
        isLoading={true}
        isError={false}
        config={{ sort: { column: "Score", dir: "desc" } }}
        labels={LABELS}
      />,
    );
    rerender(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{ sort: { column: "Score", dir: "desc" } }}
        labels={LABELS}
      />,
    );

    const scoreHeader = screen.getByText("Score").closest("th") as HTMLElement;
    expect(scoreHeader).toHaveAttribute("aria-sort", "descending");

    const names = dataRows(container).map(
      (row) => row.querySelector("td")?.textContent,
    );
    expect(names).toEqual(["Alpha", "Charlie", "Bravo"]);
  });

  it("clears an initial config sort when the user toggles the header off", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{ sort: { column: "Score", dir: "desc" } }}
        labels={LABELS}
      />,
    );
    const scoreHeader = screen.getByText("Score").closest("th") as HTMLElement;
    expect(scoreHeader).toHaveAttribute("aria-sort", "descending");

    // desc → (toggle) off; must not fall back to the config sort
    await user.click(screen.getByText("Score"));
    expect(scoreHeader).not.toHaveAttribute("aria-sort");
    const names = dataRows(container).map(
      (row) => row.querySelector("td")?.textContent,
    );
    expect(names).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("applies the threshold text class and label badge to matching cells", () => {
    render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
      />,
    );
    const goodCell = screen.getByText("95").closest("td") as HTMLElement;
    expect(goodCell.className).toContain("text-success");
    expect(within(goodCell).getByText("Great")).toBeInTheDocument();

    const criticalCell = screen.getByText("40").closest("td") as HTMLElement;
    expect(criticalCell.className).toContain("text-destructive");

    const unmatchedCell = screen.getByText("70").closest("td") as HTMLElement;
    expect(unmatchedCell.className).not.toContain("text-success");
    expect(unmatchedCell.className).not.toContain("text-destructive");
  });

  it("filters rows via the search input (case-insensitive)", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{ searchable: true }}
        labels={LABELS}
      />,
    );
    await user.type(screen.getByLabelText("Search rows"), "bRaVo");
    const rows = dataRows(container);
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain("Bravo");
  });

  it("fires onRowClick with the mediaId only for rows that have one", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{ rowClick: "openMedia" }}
        labels={LABELS}
        onRowClick={onRowClick}
      />,
    );
    await user.click(screen.getByText("Alpha"));
    expect(onRowClick).toHaveBeenCalledWith("m1");

    onRowClick.mockClear();
    await user.click(screen.getByText("Charlie")); // no mediaId
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("supports keyboard activation (Enter) on clickable rows", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <TableWidget
        data={DATA}
        isLoading={false}
        isError={false}
        config={{ rowClick: "openMedia" }}
        labels={LABELS}
        onRowClick={onRowClick}
      />,
    );
    const row = screen.getByText("Alpha").closest("tr") as HTMLElement;
    row.focus();
    await user.keyboard("{Enter}");
    expect(onRowClick).toHaveBeenCalledWith("m1");
  });

  it("shows empty / error / loading states", () => {
    const empty = render(
      <TableWidget
        data={{ columns: [], rows: [], total: 0 }}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
      />,
    );
    expect(empty.getByText("No rows")).toBeInTheDocument();

    const error = render(
      <TableWidget isLoading={false} isError={true} config={{}} labels={LABELS} />,
    );
    expect(error.getByText("Could not load table")).toBeInTheDocument();

    const loading = render(
      <TableWidget isLoading={true} isError={false} config={{}} labels={LABELS} />,
    );
    expect(loading.container.querySelector(".animate-pulse")).not.toBeNull();
  });
});

describe("TableWidget pagination", () => {
  const manyRows = (count: number): TableWidgetData => ({
    columns: [{ header: "Score", format: "number" }],
    rows: Array.from({ length: count }, (_, i) => ({
      name: `Row ${String(i + 1).padStart(3, "0")}`,
      mediaId: `m${i + 1}`,
      cells: [i + 1],
    })),
    total: count,
  });

  it("hides the pager when every row fits on one page", () => {
    render(
      <TableWidget data={DATA} isLoading={false} isError={false} config={{}} labels={LABELS} />,
    );
    expect(screen.queryByLabelText("Next page")).toBeNull();
  });

  it("shows 25 rows by default and pages through the rest", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget data={manyRows(54)} isLoading={false} isError={false} config={{}} labels={LABELS} />,
    );
    expect(dataRows(container)).toHaveLength(25);
    expect(screen.getByText("1–25 of 54")).toBeInTheDocument();
    expect(screen.getByLabelText("Previous page")).toBeDisabled();

    await user.click(screen.getByLabelText("Next page"));
    expect(dataRows(container)).toHaveLength(25);
    expect(screen.getByText("26–50 of 54")).toBeInTheDocument();
    expect(dataRows(container)[0].textContent).toContain("Row 026");

    await user.click(screen.getByLabelText("Next page"));
    expect(dataRows(container)).toHaveLength(4);
    expect(screen.getByText("51–54 of 54")).toBeInTheDocument();
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("honours config.pageSize and lets the viewer change rows per page", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget
        data={manyRows(54)}
        isLoading={false}
        isError={false}
        config={{ pageSize: 10 }}
        labels={LABELS}
      />,
    );
    expect(dataRows(container)).toHaveLength(10);
    await user.selectOptions(screen.getByLabelText("Rows per page"), "50");
    expect(dataRows(container)).toHaveLength(50);
    expect(screen.getByText("1–50 of 54")).toBeInTheDocument();
  });

  it("returns to the first page when the sort changes", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget data={manyRows(54)} isLoading={false} isError={false} config={{}} labels={LABELS} />,
    );
    await user.click(screen.getByLabelText("Next page"));
    expect(screen.getByText("26–50 of 54")).toBeInTheDocument();

    await user.click(screen.getByText("Score")); // asc
    await user.click(screen.getByText("Score")); // desc
    expect(screen.getByText("1–25 of 54")).toBeInTheDocument();
    expect(dataRows(container)[0].textContent).toContain("Row 054");
  });

  it("pages over the searched subset, not the full data set", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <TableWidget
        data={manyRows(54)}
        isLoading={false}
        isError={false}
        config={{ searchable: true, pageSize: 10 }}
        labels={LABELS}
      />,
    );
    await user.click(screen.getByLabelText("Next page"));
    await user.type(screen.getByPlaceholderText("Search rows"), "Row 04");
    // Row 040..049 = 10 rows, so one page and the pager collapses
    expect(dataRows(container)).toHaveLength(10);
    expect(screen.queryByLabelText("Next page")).toBeNull();
  });

  it("uses custom pager labels when provided", () => {
    render(
      <TableWidget
        data={manyRows(30)}
        isLoading={false}
        isError={false}
        config={{}}
        labels={{
          ...LABELS,
          rowsPerPage: "Lignes par page",
          nextPage: "Suivant",
          previousPage: "Précédent",
          pageSummary: (from, to, total) => `${from} à ${to} sur ${total}`,
        }}
      />,
    );
    expect(screen.getByText("Lignes par page")).toBeInTheDocument();
    expect(screen.getByLabelText("Suivant")).toBeInTheDocument();
    expect(screen.getByText("1 à 25 sur 30")).toBeInTheDocument();
  });
});

describe("TableWidget top scrollbar", () => {
  it("renders a mirrored top scrollbar only when the table overflows its container", () => {
    const { container, rerender } = render(
      <TableWidget data={DATA} isLoading={false} isError={false} config={{}} labels={LABELS} />,
    );
    // jsdom reports 0 for scrollWidth/clientWidth: no overflow, no bar.
    expect(screen.queryByTestId("table-top-scrollbar")).toBeNull();

    const table = container.querySelector("table") as HTMLTableElement;
    const wrapper = table.parentElement as HTMLElement;
    Object.defineProperty(table, "scrollWidth", { configurable: true, value: 1600 });
    Object.defineProperty(wrapper, "clientWidth", { configurable: true, value: 800 });

    // A data change re-measures; the bar appears sized to the table width.
    rerender(
      <TableWidget
        data={{ ...DATA, rows: [...DATA.rows] }}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
      />,
    );
    const bar = screen.getByTestId("table-top-scrollbar");
    expect(bar).toBeInTheDocument();
    expect((bar.firstElementChild as HTMLElement).style.width).toBe("1600px");
  });
});

describe("TableWidget cards", () => {
  const CARD_DATA: TableWidgetData = {
    columns: [{ header: "Track" }, { header: "Speaker" }, { header: "Room" }],
    rows: [
      {
        name: "Opening keynote",
        mediaId: "m1",
        mediaType: "video",
        mediaUrl: "https://media.example/m1.mp4",
        durationSec: 3725,
        cells: ["Health", "Ada", "Hall A"],
      },
      { name: "Podcast live", mediaId: "m2", mediaType: "audio", cells: ["Tech", "Grace", "Hall B"] },
    ],
    total: 2,
  };
  const cardConfig = {
    display: "cards" as const,
    rowClick: "openMedia" as const,
    card: { subtitleColumns: ["Track", "Speaker"], detailColumns: ["Room"] },
  };

  const PLAY_OVERLAY = ".rounded-full.bg-black\\/70";

  it("shows a card skeleton grid while loading, then a card per row with a topic chip and play overlay that opens the media on click", async () => {
    const onRowClick = vi.fn();
    const { container, rerender } = render(
      <TableWidget data={undefined} isLoading={true} isError={false} config={cardConfig} labels={LABELS} />,
    );
    expect(container.querySelectorAll(".aspect-video")).toHaveLength(3);

    rerender(
      <TableWidget
        data={CARD_DATA}
        isLoading={false}
        isError={false}
        config={cardConfig}
        labels={LABELS}
        onRowClick={onRowClick}
      />,
    );
    expect(container.querySelector("table")).toBeNull();
    expect(screen.getByRole("heading", { name: "Opening keynote" })).toBeInTheDocument();
    expect(screen.getByText("Health").closest(".bg-muted")).not.toBeNull();
    expect(screen.getByText("Ada").tagName).toBe("P");
    expect(screen.getByText("Hall A")).toBeInTheDocument();
    expect(screen.getByText("1:02:05")).toBeInTheDocument();
    expect(container.querySelectorAll(PLAY_OVERLAY)).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Opening keynote" }));
    expect(onRowClick).toHaveBeenCalledWith("m1");
  });

  it("renders plain cards without a play overlay when row click is off and the shared empty state when search matches nothing", async () => {
    const { container } = render(
      <TableWidget
        data={CARD_DATA}
        isLoading={false}
        isError={false}
        config={{ ...cardConfig, rowClick: "none", searchable: true }}
        labels={LABELS}
      />,
    );
    expect(screen.getByRole("heading", { name: "Opening keynote" })).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector(PLAY_OVERLAY)).toBeNull();

    await userEvent.type(screen.getByRole("searchbox"), "zzz");
    expect(screen.getByText("No rows")).toBeInTheDocument();
    expect(screen.getByText("Nothing matched.")).toBeInTheDocument();
  });

  it("loads the poster only once in view, skips audio, and falls back when the video fails", async () => {
    const observers: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) {
          observers.push(cb);
        }
        observe() {}
        disconnect() {}
      },
    );
    const { container } = render(
      <TableWidget data={CARD_DATA} isLoading={false} isError={false} config={cardConfig} labels={LABELS} />,
    );
    expect(container.querySelector("video")).toBeNull();

    act(() => observers.forEach((cb) => cb([{ isIntersecting: true }])));
    expect(container.querySelectorAll("video")).toHaveLength(1);
    expect(screen.getByText("Audio")).toBeInTheDocument();

    const video = container.querySelector("video") as HTMLVideoElement;
    expect(video.getAttribute("src")).toBe("https://media.example/m1.mp4#t=3");
    fireEvent.error(video);
    await waitFor(() => expect(container.querySelector("video")).toBeNull());
    vi.unstubAllGlobals();
  });
});

describe("TableWidget speaker avatars", () => {
  const GROUP_DATA: TableWidgetData = {
    columns: [{ header: "Sessions", format: "number" }],
    rows: [
      { name: "Alex Rivera", cells: [4] },
      { name: "Sam Chen", cells: [2] },
    ],
    total: 2,
  };
  const PHOTO = "https://photos.example/alex.jpg";
  const lookup = (name: string) => (name === "Alex Rivera" ? PHOTO : undefined);

  const renderGroups = (props: Partial<React.ComponentProps<typeof TableWidget>> = {}) =>
    render(
      <TableWidget
        data={GROUP_DATA}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
        {...props}
      />,
    );

  it("renders no avatar on group rows without rowAvatar", () => {
    const { container } = renderGroups();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.queryByTitle("Alex Rivera")).toBeNull();
  });

  it("shows a lazy, no-referrer photo for known names and initials for the rest", () => {
    const { container } = renderGroups({ rowAvatar: lookup });
    const img = container.querySelector("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(PHOTO);
    expect(img.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(img.getAttribute("loading")).toBe("lazy");
    expect(container.querySelectorAll("img")).toHaveLength(1);
    expect(screen.getByTitle("Sam Chen")).toHaveTextContent("SC");
    expect(screen.getByText("Sam Chen")).toBeInTheDocument();
  });

  it("hides the row avatar from assistive tech because the name is already text", () => {
    renderGroups({ rowAvatar: lookup });
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("keeps group row clicks working and skips avatars on media rows", async () => {
    const onGroupRowClick = vi.fn();
    const { container } = renderGroups({ rowAvatar: lookup, onGroupRowClick });
    await userEvent.click(screen.getByText("Alex Rivera"));
    expect(onGroupRowClick).toHaveBeenCalledWith("Alex Rivera");

    const { container: media } = render(
      <TableWidget
        data={{ columns: [], rows: [{ name: "Alpha", mediaId: "m1", cells: [] }], total: 1 }}
        isLoading={false}
        isError={false}
        config={{}}
        labels={LABELS}
        rowAvatar={() => PHOTO}
      />,
    );
    expect(media.querySelector("img")).toBeNull();
    expect(container.querySelectorAll("img")).toHaveLength(1);
  });

  it("resolves card avatars from the avatarColumn value", () => {
    const { container } = render(
      <TableWidget
        data={{
          columns: [{ header: "Track" }, { header: "Speaker" }],
          rows: [
            { name: "Opening keynote", mediaId: "m1", cells: ["Health", "Alex Rivera"] },
            { name: "Panel", mediaId: "m2", cells: ["Tech", "Sam Chen"] },
          ],
          total: 2,
        }}
        isLoading={false}
        isError={false}
        config={{ display: "cards", card: { subtitleColumns: ["Track"], avatarColumn: "Speaker" } }}
        labels={LABELS}
        cardAvatar={lookup}
      />,
    );
    const imgs = container.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].getAttribute("src")).toBe(PHOTO);
    expect(imgs[0].getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(imgs[0].getAttribute("loading")).toBe("lazy");
    expect(imgs[0].closest(".rounded-full")).not.toBeNull();
  });

  it("ignores avatarColumn when cardAvatar is not provided", () => {
    const { container } = render(
      <TableWidget
        data={{
          columns: [{ header: "Speaker" }],
          rows: [{ name: "Opening keynote", mediaId: "m1", cells: ["Alex Rivera"] }],
          total: 1,
        }}
        isLoading={false}
        isError={false}
        config={{ display: "cards", card: { avatarColumn: "Speaker" } }}
        labels={LABELS}
      />,
    );
    expect(container.querySelector("img")).toBeNull();
  });
});
