import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook, act } from "@testing-library/react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableActions,
  TableActionButton,
  TableSkeleton,
  TableSortHead,
  TablePagination,
  TableEmpty,
  useSort,
} from "../../src/components/Table";

describe("Table", () => {
  const renderBasicTable = () =>
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Alice</TableCell>
            <TableCell>alice@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );

  it("renders a full table structure", () => {
    renderBasicTable();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("has scrollable wrapper by default", () => {
    const { container } = renderBasicTable();
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-x-auto");
  });

  it("disables scroll when scrollable=false", () => {
    const { container } = render(
      <Table scrollable={false}>
        <TableBody>
          <TableRow><TableCell>A</TableCell></TableRow>
        </TableBody>
      </Table>
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("overflow-hidden");
  });

  it("TableHead renders with scope=col", () => {
    renderBasicTable();
    const th = screen.getByText("Name");
    expect(th).toHaveAttribute("scope", "col");
  });
});

describe("TableRow", () => {
  it("renders with role=row", () => {
    render(
      <table><tbody><TableRow><td>Cell</td></TableRow></tbody></table>
    );
    expect(screen.getByRole("row")).toBeInTheDocument();
  });

  it("is focusable when clickable", () => {
    render(
      <table><tbody><TableRow clickable><td>Cell</td></TableRow></tbody></table>
    );
    expect(screen.getByRole("row")).toHaveAttribute("tabindex", "0");
  });

  it("handles Enter key when clickable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <table><tbody><TableRow clickable onClick={onClick}><td>Cell</td></TableRow></tbody></table>
    );
    const row = screen.getByRole("row");
    row.focus();
    await user.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalled();
  });

  it("handles Space key when clickable", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <table><tbody><TableRow clickable onClick={onClick}><td>Cell</td></TableRow></tbody></table>
    );
    const row = screen.getByRole("row");
    row.focus();
    await user.keyboard(" ");
    expect(onClick).toHaveBeenCalled();
  });
});

describe("TableActions", () => {
  it("stops click propagation", async () => {
    const user = userEvent.setup();
    const rowClick = vi.fn();
    const actionClick = vi.fn();
    render(
      <table>
        <tbody>
          <TableRow clickable onClick={rowClick}>
            <TableCell>
              <TableActions>
                <button onClick={actionClick}>Delete</button>
              </TableActions>
            </TableCell>
          </TableRow>
        </tbody>
      </table>
    );
    await user.click(screen.getByText("Delete"));
    expect(actionClick).toHaveBeenCalled();
    expect(rowClick).not.toHaveBeenCalled();
  });
});

describe("TableActionButton", () => {
  it("renders with aria-label", () => {
    render(<TableActionButton label="Delete item">X</TableActionButton>);
    expect(screen.getByLabelText("Delete item")).toBeInTheDocument();
  });

  it("supports danger variant", () => {
    const { container } = render(
      <TableActionButton label="Delete" variant="danger">X</TableActionButton>
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});

describe("TableSkeleton", () => {
  it("renders with default columns and rows", () => {
    const { container } = render(<TableSkeleton />);
    const headerCells = container.querySelectorAll("th");
    expect(headerCells).toHaveLength(4); // default columns = 4
  });

  it("renders simple bar mode with rowHeight", () => {
    const { container } = render(<TableSkeleton rowHeight="h-16" rows={3} />);
    // Bar mode doesn't render a table
    expect(container.querySelector("table")).not.toBeInTheDocument();
    const bars = container.querySelectorAll(".animate-pulse");
    expect(bars).toHaveLength(3);
  });
});

describe("TableSortHead", () => {
  it("renders sortable header", () => {
    const onSort = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" onSort={onSort}>Name</TableSortHead>
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText("Name")).toBeInTheDocument();
  });

  it("cycles through sort directions on click", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort={null} direction={null} onSort={onSort}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    await user.click(screen.getByText("Name"));
    expect(onSort).toHaveBeenCalledWith("name", "asc");
  });

  it("goes from asc to desc when active", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort="name" direction="asc" onSort={onSort}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    await user.click(screen.getByText("Name"));
    expect(onSort).toHaveBeenCalledWith("name", "desc");
  });

  it("goes from desc to null (clears sort)", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort="name" direction="desc" onSort={onSort}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    await user.click(screen.getByText("Name"));
    expect(onSort).toHaveBeenCalledWith("name", null);
  });

  it("sets aria-sort when active", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort="name" direction="asc" onSort={() => {}}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText("Name").closest("th")).toHaveAttribute("aria-sort", "ascending");
  });

  // ── Sort icon rendering tests ─────────────────────────────────────────
  // Guards against the safelist regression that broke sort icon visibility
  // (text-muted-foreground/40 class was missing from compiled output).

  it("renders ▲ icon when active and direction=asc", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort="name" direction="asc" onSort={() => {}}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText("▲")).toBeInTheDocument();
  });

  it("renders ▼ icon when active and direction=desc", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort="name" direction="desc" onSort={() => {}}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    expect(screen.getByText("▼")).toBeInTheDocument();
  });

  it("does not render ↕ icon when column is inactive", () => {
    render(
      <table>
        <thead>
          <tr>
            <TableSortHead sortKey="name" activeSort={null} direction={null} onSort={() => {}}>
              Name
            </TableSortHead>
          </tr>
        </thead>
      </table>
    );
    expect(screen.queryByText("↕")).not.toBeInTheDocument();
  });
});

describe("TablePagination", () => {
  it("renders page info", () => {
    render(
      <TablePagination page={1} pageSize={10} total={50} onPageChange={() => {}} />
    );
    expect(screen.getByText(/Page 1 of 5/)).toBeInTheDocument();
    expect(screen.getByText(/50 total/)).toBeInTheDocument();
  });

  it("shows 'No results' when total is 0", () => {
    render(
      <TablePagination page={1} pageSize={10} total={0} onPageChange={() => {}} />
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("disables previous on first page", () => {
    render(
      <TablePagination page={1} pageSize={10} total={50} onPageChange={() => {}} />
    );
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
  });

  it("disables next on last page", () => {
    render(
      <TablePagination page={5} pageSize={10} total={50} onPageChange={() => {}} />
    );
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onPageChange when clicking next", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <TablePagination page={1} pageSize={10} total={50} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText("Next page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when clicking previous", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <TablePagination page={3} pageSize={10} total={50} onPageChange={onPageChange} />
    );
    await user.click(screen.getByLabelText("Previous page"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("shows Previous and Next buttons", () => {
    render(
      <TablePagination page={2} pageSize={10} total={50} onPageChange={() => {}} />
    );
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
  });

  it("shows page size selector when onPageSizeChange provided", () => {
    render(
      <TablePagination
        page={1}
        pageSize={10}
        total={50}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    );
    expect(screen.getByText("Rows:")).toBeInTheDocument();
  });

  it("calls onPageSizeChange and resets to page 1", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();
    render(
      <TablePagination
        page={3}
        pageSize={10}
        total={50}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );
    await user.selectOptions(screen.getByDisplayValue("10"), "25");
    expect(onPageSizeChange).toHaveBeenCalledWith(25);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("formats large numbers with locale separator", () => {
    render(
      <TablePagination page={1} pageSize={10} total={1234567} onPageChange={() => {}} />
    );
    // toLocaleString() should add commas
    expect(screen.getByText(/1,234,567 total/)).toBeInTheDocument();
  });
});

describe("TableEmpty", () => {
  it("renders default empty message", () => {
    render(
      <table>
        <tbody>
          <TableEmpty colSpan={4} />
        </tbody>
      </table>
    );
    expect(screen.getByText("No results")).toBeInTheDocument();
  });

  it("renders custom title and description", () => {
    render(
      <table>
        <tbody>
          <TableEmpty colSpan={4} title="No data" description="Try adjusting your search" />
        </tbody>
      </table>
    );
    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByText("Try adjusting your search")).toBeInTheDocument();
  });

  it("renders action slot", () => {
    render(
      <table>
        <tbody>
          <TableEmpty colSpan={4} action={<button>Add item</button>} />
        </tbody>
      </table>
    );
    expect(screen.getByText("Add item")).toBeInTheDocument();
  });
});

describe("useSort", () => {
  const data = [
    { name: "Charlie", age: 30 },
    { name: "Alice", age: 25 },
    { name: "Bob", age: 35 },
  ];

  const sortFn = (a: typeof data[0], b: typeof data[0], key: string, dir: "asc" | "desc" | null) => {
    if (!dir) return 0;
    const aVal = a[key as keyof typeof a];
    const bVal = b[key as keyof typeof b];
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return dir === "asc" ? cmp : -cmp;
  };

  it("returns unsorted data initially", () => {
    const { result } = renderHook(() => useSort(data, sortFn));
    expect(result.current.sortedData).toEqual(data);
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sortDir).toBeNull();
  });

  it("sorts data ascending", () => {
    const { result } = renderHook(() => useSort(data, sortFn));
    act(() => result.current.onSort("name", "asc"));
    expect(result.current.sortedData[0].name).toBe("Alice");
    expect(result.current.sortedData[2].name).toBe("Charlie");
  });

  it("sorts data descending", () => {
    const { result } = renderHook(() => useSort(data, sortFn));
    act(() => result.current.onSort("name", "desc"));
    expect(result.current.sortedData[0].name).toBe("Charlie");
    expect(result.current.sortedData[2].name).toBe("Alice");
  });

  it("clears sort when direction is null", () => {
    const { result } = renderHook(() => useSort(data, sortFn));
    act(() => result.current.onSort("name", "asc"));
    act(() => result.current.onSort("name", null));
    expect(result.current.sortKey).toBeNull();
    expect(result.current.sortedData).toEqual(data);
  });

  it("returns original data when no sortFn provided", () => {
    const { result } = renderHook(() => useSort(data));
    act(() => result.current.onSort("name", "asc"));
    expect(result.current.sortedData).toEqual(data);
  });
});
