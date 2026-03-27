import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Badge, StatusBadge } from "../src/components/Badge";
import { Input, SearchInput, Select, Textarea } from "../src/components/Input";
import { EmptyState } from "../src/components/EmptyState";
import { ErrorState } from "../src/components/ErrorState";
import { StatCard, StatCardGrid } from "../src/components/StatCard";
import { PageHeader, SectionHeader } from "../src/components/PageHeader";
import { InfoCard } from "../src/components/InfoCard";
import { Progress } from "../src/components/Progress";
import { Avatar } from "../src/components/Avatar";
import { Switch } from "../src/components/Switch";
import { Checkbox } from "../src/components/Checkbox";
import { Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton } from "../src/components/Dialog";
import { ConfirmDialog } from "../src/components/ConfirmDialog";
import { SidePanel } from "../src/components/SidePanel";
import { ThemeToggle, ThemeSelector } from "../src/components/ThemeToggle";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../src/components/Tabs";
import { ToastContainer } from "../src/components/Toast";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TablePagination,
} from "../src/components/Table";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuDivider,
  MoreButton,
} from "../src/components/DropdownMenu";

expect.extend(toHaveNoViolations);

afterEach(cleanup);

// Helper to render a component inside a theme wrapper
function renderWithTheme(ui: React.ReactElement, theme: "light" | "dark") {
  return render(
    <div className={theme === "dark" ? "dark" : ""}>
      {ui}
    </div>
  );
}

// ── Accessibility Tests (axe) ─────────────────────────────────────────────
// Each component tested in both light and dark mode to ensure
// no accessibility violations in either theme.

const themes = ["light", "dark"] as const;

describe.each(themes)("Accessibility — %s mode", (theme) => {
  it("Button has no a11y violations", async () => {
    const { container } = renderWithTheme(<Button>Click me</Button>, theme);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Button (loading) has no a11y violations", async () => {
    const { container } = renderWithTheme(<Button isLoading>Save</Button>, theme);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Button (disabled) has no a11y violations", async () => {
    const { container } = renderWithTheme(<Button disabled>Disabled</Button>, theme);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Card has no a11y violations", async () => {
    const { container } = renderWithTheme(<Card>Content</Card>, theme);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Badge has no a11y violations", async () => {
    const { container } = renderWithTheme(<Badge>Active</Badge>, theme);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatusBadge has no a11y violations", async () => {
    const { container } = renderWithTheme(<StatusBadge status="active" />, theme);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Input has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <div>
        <label htmlFor="name">Name</label>
        <Input id="name" placeholder="Enter name" />
      </div>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Input (error) has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <div>
        <label htmlFor="email">Email</label>
        <Input id="email" error="Invalid email" />
      </div>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SearchInput has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <SearchInput aria-label="Search" placeholder="Search..." />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Select has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <div>
        <label htmlFor="color">Color</label>
        <Select id="color" options={[{ value: "red", label: "Red" }]} />
      </div>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Textarea has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <div>
        <label htmlFor="bio">Bio</label>
        <Textarea id="bio" placeholder="Tell us about yourself" />
      </div>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("EmptyState has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <EmptyState title="No items" description="Add some items to get started" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ErrorState has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <ErrorState onRetry={() => {}} />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatCard has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <StatCard label="Users" value={42} />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("PageHeader has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <PageHeader title="Dashboard" description="Overview" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SectionHeader has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <SectionHeader title="Settings" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("InfoCard has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <InfoCard title="Note" description="Important info" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Progress has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <Progress value={50} showLabel aria-label="Upload progress" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Avatar has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <Avatar name="John Doe" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Switch has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <Switch checked={false} onChange={() => {}} label="Notifications" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Checkbox has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <Checkbox label="Accept terms" />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Dialog has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <Dialog open onClose={() => {}} aria-label="Example dialog">
        <DialogHeader>
          <h2>Title</h2>
          <DialogCloseButton onClose={() => {}} />
        </DialogHeader>
        <DialogBody>Content</DialogBody>
        <DialogFooter>
          <Button>Close</Button>
        </DialogFooter>
      </Dialog>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ConfirmDialog has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <ConfirmDialog
        open
        onClose={() => {}}
        onConfirm={() => {}}
        title="Delete?"
        description="This cannot be undone."
        aria-label="Confirm deletion"
      />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("SidePanel has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <SidePanel open onClose={() => {}} title="Details">Panel content</SidePanel>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ThemeToggle has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <ThemeToggle theme="light" onChange={() => {}} />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ThemeSelector has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <ThemeSelector theme="light" onChange={() => {}} />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Tabs has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <Tabs defaultTab="t1">
        <TabsList>
          <TabsTrigger value="t1">Tab 1</TabsTrigger>
          <TabsTrigger value="t2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="t1">Content 1</TabsContent>
        <TabsContent value="t2">Content 2</TabsContent>
      </Tabs>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("Table has no a11y violations", async () => {
    const { container } = renderWithTheme(
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
            <TableCell>alice@test.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("TablePagination has no a11y violations", async () => {
    const { container } = renderWithTheme(
      <TablePagination page={1} pageSize={10} total={50} onPageChange={() => {}} />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("ToastContainer has no a11y violations", async () => {
    const toasts = [
      { id: "1", type: "success" as const, title: "Saved!" },
      { id: "2", type: "error" as const, title: "Failed", message: "Oops" },
    ];
    const { container } = renderWithTheme(
      <ToastContainer toasts={toasts} onDismiss={() => {}} />,
      theme
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("MoreButton has no a11y violations", async () => {
    const { container } = renderWithTheme(<MoreButton />, theme);
    expect(await axe(container)).toHaveNoViolations();
  });
});
