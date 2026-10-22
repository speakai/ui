import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";
import { ToastProvider, ToastContainer, useToast } from "../../src/components/Toast";
import { ReactNode } from "react";

// Wrapper for useToast hook
const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastProvider>{children}</ToastProvider>
);

describe("ToastContainer", () => {
  it("calls onDismiss when dismiss button clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const toasts = [{ id: "toast-1", type: "success" as const, title: "Done" }];
    render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    await user.click(screen.getByLabelText("Dismiss notification"));
    // onDismiss is called after animation timeout (150ms)
    await vi.waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith("toast-1");
    });
  });

  it("renders all toast types with correct icons", () => {
    const toasts = [
      { id: "1", type: "success" as const, title: "S" },
      { id: "2", type: "error" as const, title: "E" },
      { id: "3", type: "info" as const, title: "I" },
      { id: "4", type: "warning" as const, title: "W" },
    ];
    render(<ToastContainer toasts={toasts} onDismiss={() => {}} />);
    expect(screen.getByText("S")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.getByText("I")).toBeInTheDocument();
    expect(screen.getByText("W")).toBeInTheDocument();
    // Each toast should have an icon (aria-hidden SVG)
    const icons = document.querySelectorAll('svg[aria-hidden="true"]');
    // 4 type icons + 4 dismiss X icons = 8
    expect(icons.length).toBe(8);
  });

});

describe("useToast", () => {
  it("throws when used outside ToastProvider", () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow("useToast must be used within a ToastProvider");
  });

  it("adds a toast via addToast", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.addToast({ type: "success", title: "Done" });
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Done");
  });

  it("provides convenience methods (success, error, info, warning)", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.success("Success!");
      result.current.error("Error!");
      result.current.info("Info!");
      result.current.warning("Warning!");
    });
    expect(result.current.toasts).toHaveLength(4);
    expect(result.current.toasts.map((t) => t.type)).toEqual([
      "success",
      "error",
      "info",
      "warning",
    ]);
  });

  it("dismisses a toast", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.success("Will dismiss");
    });
    const id = result.current.toasts[0].id;
    act(() => {
      result.current.dismissToast(id);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("generates unique IDs for each toast", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.success("A");
      result.current.success("B");
    });
    const ids = result.current.toasts.map((t) => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it("includes message in convenience methods", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.error("Failed", "Details here");
    });
    expect(result.current.toasts[0].message).toBe("Details here");
  });

  it("dismissing non-existent ID does not throw", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.dismissToast("non-existent-id");
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("caps visible toasts at MAX_VISIBLE (5)", () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.success(`Toast ${i}`);
      }
    });
    expect(result.current.toasts).toHaveLength(5);
    // Should keep the latest 5
    expect(result.current.toasts[0].title).toBe("Toast 2");
    expect(result.current.toasts[4].title).toBe("Toast 6");
  });
});
