/**
 * Debounced ResizeObserver width (px) for a chart container element.
 * Returns `initialWidth` until the element reports a real (> 0) size —
 * detached nodes and jsdom measure 0, which would falsely read as mobile.
 */

import { useEffect, useState, type RefObject } from "react";

export function useContainerWidth(
  ref: RefObject<HTMLElement | null>,
  initialWidth = 800,
): number {
  const [width, setWidth] = useState(initialWidth);
  const [el, setEl] = useState<HTMLElement | null>(null);

  // The measured node can mount after the first render (e.g. a widget that
  // starts in a loading state), so sync the live node on every commit.
  useEffect(() => {
    if (ref.current !== el) setEl(ref.current);
  });

  useEffect(() => {
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const next = entries[0]?.contentRect.width;
        if (next && next > 0) setWidth(Math.floor(next));
      }, 100);
    });

    observer.observe(el);
    const measured = Math.floor(el.clientWidth);
    if (measured > 0) setWidth(measured);
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [el]);

  return width;
}
