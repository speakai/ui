import { describe, it, expect, afterEach } from "vitest";
import type { ReactElement } from "react";
import { render, cleanup, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { Button } from "../src/components/Button";
import { Card } from "../src/components/Card";
import { Badge, StatusBadge } from "../src/components/Badge";
import { Input, SearchInput, Select, Textarea } from "../src/components/Input";
import { EmptyState } from "../src/components/EmptyState";
import { ErrorState } from "../src/components/ErrorState";
import { StatCard } from "../src/components/StatCard";
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
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TablePagination } from "../src/components/Table";
import { MoreButton } from "../src/components/DropdownMenu";

expect.extend(toHaveNoViolations);

afterEach(cleanup);

const noop = () => {};

const IN_PLACE: Array<[string, ReactElement]> = [
  ["Button", <Button>Click me</Button>],
  ["Button (loading)", <Button isLoading>Save</Button>],
  ["Button (disabled)", <Button disabled>Disabled</Button>],
  ["Card", <Card>Content</Card>],
  ["Badge", <Badge>Active</Badge>],
  ["StatusBadge", <StatusBadge status="active" />],
  ["Input", <div><label htmlFor="name">Name</label><Input id="name" placeholder="Enter name" /></div>],
  ["Input (error)", <div><label htmlFor="email">Email</label><Input id="email" error="Invalid email" /></div>],
  ["SearchInput", <SearchInput aria-label="Search" placeholder="Search..." />],
  ["Select", <div><label htmlFor="color">Color</label><Select id="color" options={[{ value: "red", label: "Red" }]} /></div>],
  ["Textarea", <div><label htmlFor="bio">Bio</label><Textarea id="bio" placeholder="Tell us about yourself" /></div>],
  ["EmptyState", <EmptyState title="No items" description="Add some items to get started" />],
  ["ErrorState", <ErrorState onRetry={noop} />],
  ["StatCard", <StatCard label="Users" value={42} />],
  ["PageHeader", <PageHeader title="Dashboard" description="Overview" />],
  ["SectionHeader", <SectionHeader title="Settings" />],
  ["InfoCard", <InfoCard title="Note" description="Important info" />],
  ["Progress", <Progress value={50} showLabel aria-label="Upload progress" />],
  ["Avatar", <Avatar name="John Doe" />],
  ["Switch", <Switch checked={false} onChange={noop} label="Notifications" />],
  ["Checkbox", <Checkbox label="Accept terms" />],
  ["SidePanel", <SidePanel open onClose={noop} title="Details">Panel content</SidePanel>],
  ["ThemeToggle", <ThemeToggle theme="light" onChange={noop} />],
  ["ThemeSelector", <ThemeSelector theme="light" onChange={noop} />],
  [
    "Tabs",
    <Tabs defaultTab="t1">
      <TabsList>
        <TabsTrigger value="t1">Tab 1</TabsTrigger>
        <TabsTrigger value="t2">Tab 2</TabsTrigger>
      </TabsList>
      <TabsContent value="t1">Content 1</TabsContent>
      <TabsContent value="t2">Content 2</TabsContent>
    </Tabs>,
  ],
  [
    "Table",
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
  ],
  ["TablePagination", <TablePagination page={1} pageSize={10} total={50} onPageChange={noop} />],
  [
    "ToastContainer",
    <ToastContainer
      toasts={[
        { id: "1", type: "success", title: "Saved!" },
        { id: "2", type: "error", title: "Failed", message: "Oops" },
      ]}
      onDismiss={noop}
    />,
  ],
  ["MoreButton", <MoreButton />],
];

const PORTALED: Array<[string, ReactElement]> = [
  [
    "Dialog",
    <Dialog open onClose={noop} aria-label="Example dialog">
      <DialogHeader>
        <h2>Title</h2>
        <DialogCloseButton onClose={noop} />
      </DialogHeader>
      <DialogBody>Content</DialogBody>
      <DialogFooter>
        <Button>Close</Button>
      </DialogFooter>
    </Dialog>,
  ],
  [
    "ConfirmDialog",
    <ConfirmDialog open onClose={noop} onConfirm={noop} title="Delete?" description="This cannot be undone." aria-label="Confirm deletion" />,
  ],
];

describe.each(["light", "dark"] as const)("accessibility in %s mode", (theme) => {
  it.each(IN_PLACE)("%s has no axe violations", async (_name, ui) => {
    const { container } = render(<div className={theme === "dark" ? "dark" : ""}>{ui}</div>);
    expect(await axe(container)).toHaveNoViolations();
  });

  // Dialogs portal to document.body, so the theme class and the axe target both live there.
  it.each(PORTALED)("%s has no axe violations", async (_name, ui) => {
    document.body.classList.toggle("dark", theme === "dark");
    try {
      render(ui);
      expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
    } finally {
      document.body.classList.remove("dark");
    }
  });
});
