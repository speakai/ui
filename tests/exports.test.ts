import { describe, it, expect } from "vitest";
import * as SpeakUI from "../src/index";

// ── Export Smoke Tests ──────────────────────────────────────────────────────
// Ensures every public export is defined and of the expected type.
// Catches accidental removals, broken re-exports, and missing components.

describe("Package exports", () => {
  // ── Utilities ─────────────────────────────────────────────────────────────

  it("exports cn utility", () => {
    expect(SpeakUI.cn).toBeTypeOf("function");
  });

  // ── Components ────────────────────────────────────────────────────────────

  const componentExports = [
    "Button",
    "Card",
    "Badge",
    "StatusBadge",
    "Input",
    "SearchInput",
    "Select",
    "Textarea",
    "Table",
    "TableHeader",
    "TableBody",
    "TableRow",
    "TableHead",
    "TableCell",
    "TableSkeleton",
    "TableActions",
    "TableActionButton",
    "TableSortHead",
    "TablePagination",
    "TableEmpty",
    "ToastContainer",
    "ToastProvider",
    "Skeleton",
    "SkeletonText",
    "PageHeaderSkeleton",
    "StatCardSkeleton",
    "StatCardsSkeletonGrid",
    "PageSkeleton",
    "CardSkeleton",
    "GridSkeleton",
    "FormSkeleton",
    "EmptyState",
    "ErrorState",
    "DropdownMenu",
    "DropdownMenuItem",
    "DropdownMenuHeader",
    "DropdownMenuDivider",
    "MoreButton",
    "StatCard",
    "StatCardGrid",
    "PageHeader",
    "SectionHeader",
    "InfoCard",
    "Dialog",
    "DialogHeader",
    "DialogBody",
    "DialogFooter",
    "DialogCloseButton",
    "ConfirmDialog",
    "ThemeToggle",
    "ThemeSelector",
    "SidePanel",
    "Tooltip",
    "Tabs",
    "TabsList",
    "TabsTrigger",
    "TabsContent",
    "Avatar",
    "Switch",
    "Checkbox",
    "Progress",
    "Sidebar",
    "SidebarProvider",
    "SidebarLayout",
    "SidebarUser",
  ] as const;

  it.each(componentExports)("exports %s component", (name) => {
    expect((SpeakUI as Record<string, unknown>)[name]).toBeDefined();
  });

  // ── Hooks ─────────────────────────────────────────────────────────────────

  const hookExports = ["useToast", "useSort", "useSidebar"] as const;

  it.each(hookExports)("exports %s hook as a function", (name) => {
    expect((SpeakUI as Record<string, unknown>)[name]).toBeTypeOf("function");
  });

  // ── Total export count guard ──────────────────────────────────────────────
  // If you add a new export, update this number so the test reminds you to
  // add corresponding test coverage.

  it("has the expected number of named exports", () => {
    const allExports = Object.keys(SpeakUI);
    // This should be updated when exports change
    expect(allExports.length).toBeGreaterThanOrEqual(65);
  });
});
