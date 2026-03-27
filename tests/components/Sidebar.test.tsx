import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { ReactNode } from "react";

beforeEach(() => {
  window.localStorage.clear();
  document.body.style.overflow = "";
});
import {
  Sidebar,
  SidebarProvider,
  SidebarLayout,
  SidebarUser,
  useSidebar,
} from "../../src/components/Sidebar";
import type { SidebarSection } from "../../src/components/Sidebar";

const sections: SidebarSection[] = [
  {
    id: "main",
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: <span>D</span> },
      { id: "users", label: "Users", href: "/users" },
      { id: "disabled-item", label: "Locked", href: "/locked", disabled: true },
    ],
  },
  {
    id: "settings",
    items: [
      { id: "config", label: "Config", onClick: vi.fn() },
    ],
  },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <SidebarProvider>{children}</SidebarProvider>
);

describe("useSidebar", () => {
  it("throws when used outside SidebarProvider", () => {
    expect(() => {
      renderHook(() => useSidebar());
    }).toThrow("useSidebar must be used within a SidebarProvider");
  });

  it("provides collapsed state", () => {
    const { result } = renderHook(() => useSidebar(), { wrapper });
    expect(result.current.collapsed).toBe(false);
    expect(result.current.mobileOpen).toBe(false);
  });
});

describe("SidebarProvider", () => {
  it("allows setting defaultCollapsed", () => {
    const customWrapper = ({ children }: { children: ReactNode }) => (
      <SidebarProvider defaultCollapsed>{children}</SidebarProvider>
    );
    const { result } = renderHook(() => useSidebar(), { wrapper: customWrapper });
    expect(result.current.collapsed).toBe(true);
  });
});

describe("Sidebar", () => {
  it("renders navigation items", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    // Sidebar renders both desktop + mobile, so use getAllByText
    expect(screen.getAllByText("Dashboard").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Users").length).toBeGreaterThanOrEqual(1);
  });

  it("renders section labels", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    // Section labels appear in both desktop and mobile sidebars
    expect(screen.getAllByText("Main").length).toBeGreaterThanOrEqual(1);
  });

  it("renders header when provided", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} header={<span>Logo</span>} />
      </SidebarProvider>
    );
    // Header appears in both desktop and mobile
    expect(screen.getAllByText("Logo").length).toBeGreaterThanOrEqual(1);
  });

  it("renders footer when provided", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} footer={<span>Footer</span>} />
      </SidebarProvider>
    );
    expect(screen.getAllByText("Footer").length).toBeGreaterThanOrEqual(1);
  });

  it("has main navigation landmark", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    expect(screen.getAllByRole("navigation", { name: "Main navigation" }).length).toBeGreaterThanOrEqual(1);
  });

  it("renders mobile hamburger button", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("renders items with href as links", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    const links = screen.getAllByRole("link");
    expect(links.some(l => l.getAttribute("href") === "/dashboard")).toBe(true);
  });

  it("renders collapse/expand button in header", () => {
    render(
      <SidebarProvider>
        <Sidebar sections={sections} header={<span>Logo</span>} />
      </SidebarProvider>
    );
    // Collapse button may appear in both desktop/mobile sidebars
    const btns = screen.getAllByLabelText("Collapse sidebar");
    expect(btns.length).toBeGreaterThanOrEqual(1);
  });

  it("supports expandable items with children", () => {
    const sectionsWithChildren: SidebarSection[] = [{
      id: "parent",
      items: [{
        id: "parent-item",
        label: "Parent",
        icon: <span>P</span>,
        children: [
          { id: "child-1", label: "Child 1", href: "/child-1" },
          { id: "child-2", label: "Child 2", href: "/child-2" },
        ],
      }],
    }];

    render(
      <SidebarProvider>
        <Sidebar sections={sectionsWithChildren} />
      </SidebarProvider>
    );
    // Parent appears in both desktop and mobile sidebars
    expect(screen.getAllByText("Parent").length).toBeGreaterThanOrEqual(1);
  });
});

describe("Sidebar interactions", () => {
  it("opens mobile drawer when hamburger clicked", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    await user.click(screen.getByLabelText("Open menu"));
    // Mobile drawer should become visible (translate-x-0)
    const mobileAside = document.querySelectorAll("aside")[1];
    expect(mobileAside.className).toContain("translate-x-0");
  });

  it("closes mobile drawer when close button clicked", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    await user.click(screen.getByLabelText("Open menu"));
    await user.click(screen.getByLabelText("Close sidebar"));
    const mobileAside = document.querySelectorAll("aside")[1];
    expect(mobileAside.className).toContain("-translate-x-full");
  });

  it("closes mobile drawer on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    await user.click(screen.getByLabelText("Open menu"));
    const mobileAside = document.querySelectorAll("aside")[1];
    expect(mobileAside.className).toContain("translate-x-0");
    await user.keyboard("{Escape}");
    expect(mobileAside.className).toContain("-translate-x-full");
  });

  it("locks body scroll when mobile drawer is open", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar sections={sections} />
      </SidebarProvider>
    );
    await user.click(screen.getByLabelText("Open menu"));
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("toggles collapse/expand on desktop", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar sections={sections} header={<span>Logo</span>} />
      </SidebarProvider>
    );
    const collapseBtn = screen.getAllByLabelText("Collapse sidebar")[0];
    await user.click(collapseBtn);
    // After collapse, button label should change to "Expand sidebar"
    expect(screen.getAllByLabelText("Expand sidebar").length).toBeGreaterThanOrEqual(1);
  });

  it("persists collapsed state to localStorage", async () => {
    const user = userEvent.setup();
    window.localStorage.clear();
    render(
      <SidebarProvider storageKey="test-sidebar">
        <Sidebar sections={sections} header={<span>Logo</span>} />
      </SidebarProvider>
    );
    const collapseBtn = screen.getAllByLabelText("Collapse sidebar")[0];
    await user.click(collapseBtn);
    expect(window.localStorage.getItem("test-sidebar")).toBe("true");
  });

  it("uses renderLink for custom link components", () => {
    const renderLink = vi.fn(({ href, className, children }) => (
      <a href={href} className={className} data-testid="custom-link">{children}</a>
    ));
    render(
      <SidebarProvider>
        <Sidebar sections={sections} renderLink={renderLink} />
      </SidebarProvider>
    );
    expect(renderLink).toHaveBeenCalled();
    expect(screen.getAllByTestId("custom-link").length).toBeGreaterThanOrEqual(1);
  });

  it("expands nested children on click", async () => {
    const user = userEvent.setup();
    const nestedSections: SidebarSection[] = [{
      id: "nav",
      items: [{
        id: "parent",
        label: "Parent",
        icon: <span>P</span>,
        children: [
          { id: "child-a", label: "Child A", href: "/a" },
          { id: "child-b", label: "Child B", href: "/b" },
        ],
      }],
    }];
    render(
      <SidebarProvider>
        <Sidebar sections={nestedSections} />
      </SidebarProvider>
    );
    // Children not visible initially (in desktop sidebar)
    expect(screen.queryByText("Child A")).not.toBeInTheDocument();
    // Click the parent button (get the first one — desktop sidebar)
    const parentBtns = screen.getAllByText("Parent");
    await user.click(parentBtns[0]);
    expect(screen.getByText("Child A")).toBeInTheDocument();
    expect(screen.getByText("Child B")).toBeInTheDocument();
  });

  it("renders active indicator on active item", () => {
    const activeSections: SidebarSection[] = [{
      id: "nav",
      items: [
        { id: "active", label: "Active Item", href: "/active", active: true, icon: <span>A</span> },
        { id: "other", label: "Other", href: "/other" },
      ],
    }];
    render(
      <SidebarProvider>
        <Sidebar sections={activeSections} />
      </SidebarProvider>
    );
    // Active items get the gradient indicator span
    const activeLinks = screen.getAllByText("Active Item");
    const activeLink = activeLinks[0].closest("a") || activeLinks[0].closest("button");
    const indicator = activeLink?.querySelector("[aria-hidden='true']");
    expect(indicator).toBeInTheDocument();
  });

  it("hides section labels when collapsed", async () => {
    const user = userEvent.setup();
    render(
      <SidebarProvider>
        <Sidebar sections={sections} header={<span>Logo</span>} />
      </SidebarProvider>
    );
    const collapseBtn = screen.getAllByLabelText("Collapse sidebar")[0];
    await user.click(collapseBtn);
    // Desktop sidebar should show separator instead of text label
    const desktopAside = document.querySelector("aside.hidden");
    const labelInDesktop = desktopAside?.querySelector("p");
    expect(labelInDesktop).not.toBeInTheDocument();
  });
});

describe("SidebarLayout", () => {
  it("renders children", () => {
    render(
      <SidebarProvider>
        <SidebarLayout>
          <div>Page content</div>
        </SidebarLayout>
      </SidebarProvider>
    );
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });
});

describe("SidebarUser", () => {
  it("renders user name when sidebar is not collapsed", () => {
    // SidebarUser hides name/email when collapsed. Default is not collapsed.
    // But it reads collapsed from context — need to ensure it's false.
    render(
      <SidebarProvider defaultCollapsed={false}>
        <SidebarUser name="John Doe" email="john@example.com" />
      </SidebarProvider>
    );
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("shows initial when no avatar", () => {
    render(
      <SidebarProvider>
        <SidebarUser name="Jane" />
      </SidebarProvider>
    );
    expect(screen.getByText("J")).toBeInTheDocument();
  });

  it("renders custom avatar", () => {
    render(
      <SidebarProvider>
        <SidebarUser name="Jane" avatar={<img src="/avatar.jpg" alt="avatar" />} />
      </SidebarProvider>
    );
    expect(screen.getByAltText("avatar")).toBeInTheDocument();
  });
});
