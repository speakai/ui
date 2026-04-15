import { describe, it, expect } from "vitest";

// ── Sub-path Exports Test ────────────────────────────────────────────────────
// After v0.11.0 added 50+ sub-path entry points with splitting:true in tsup,
// some entries silently stopped exporting their members when the barrel
// collapsed. This test verifies the three entries that broke (badge, button,
// table) plus a representative subset of other key entries.
//
// Note: React components may be plain functions, forwardRef objects, or
// Radix-wrapped objects. We assert defined (not undefined/null) rather than
// typeof === "function" to accommodate all three forms. Hooks are always
// plain functions and use toBeTypeOf("function").

import { Badge, StatusBadge } from "../src/entries/badge";
import { Button } from "../src/entries/button";
import { Table, TableSortHead, useSort } from "../src/entries/table";
import { cn } from "../src/entries/cn";
import { Dialog } from "../src/entries/dialog";
import { ToastContainer, ToastProvider, useToast } from "../src/entries/toast";
import { Sidebar, SidebarProvider, useSidebar } from "../src/entries/sidebar";

describe("Sub-path entry exports", () => {
  // ── badge (broke in regression) ──────────────────────────────────────────

  it("badge entry exports Badge", () => {
    expect(Badge).toBeDefined();
  });

  it("badge entry exports StatusBadge", () => {
    expect(StatusBadge).toBeDefined();
  });

  // ── button (broke in regression) ─────────────────────────────────────────

  it("button entry exports Button", () => {
    expect(Button).toBeDefined();
  });

  // ── table (broke in regression) ──────────────────────────────────────────

  it("table entry exports Table", () => {
    expect(Table).toBeDefined();
  });

  it("table entry exports TableSortHead", () => {
    expect(TableSortHead).toBeDefined();
  });

  it("table entry exports useSort hook as a function", () => {
    expect(useSort).toBeTypeOf("function");
  });

  // ── representative other entries ─────────────────────────────────────────

  it("cn entry exports cn as a function", () => {
    expect(cn).toBeTypeOf("function");
  });

  it("dialog entry exports Dialog", () => {
    expect(Dialog).toBeDefined();
  });

  it("toast entry exports ToastContainer", () => {
    expect(ToastContainer).toBeDefined();
  });

  it("toast entry exports ToastProvider", () => {
    expect(ToastProvider).toBeDefined();
  });

  it("toast entry exports useToast hook as a function", () => {
    expect(useToast).toBeTypeOf("function");
  });

  it("sidebar entry exports Sidebar", () => {
    expect(Sidebar).toBeDefined();
  });

  it("sidebar entry exports SidebarProvider", () => {
    expect(SidebarProvider).toBeDefined();
  });

  it("sidebar entry exports useSidebar hook as a function", () => {
    expect(useSidebar).toBeTypeOf("function");
  });
});
