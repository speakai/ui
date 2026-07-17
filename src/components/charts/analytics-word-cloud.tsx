import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ErrorInfo, ReactNode, RefObject } from "react";
import { cn } from "../../utils/cn";
import { Skeleton } from "../Skeleton";
import type { ChartInsight } from "./chart-types";

// -- Lazy-load word cloud (no SSR) -------------------------------------------

const WordCloudInner = lazy(
  () => import("@isoterik/react-word-cloud").then((mod) => ({ default: mod.WordCloud })),
);

// -- Minimal error boundary for the word cloud render -------------------------

interface ErrorBoundaryState {
  hasError: boolean;
}

class WordCloudErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Swallow — fallback is rendered below
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// -- Chart palette CSS vars for word colors -----------------------------------

const WORD_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

// -- Props -------------------------------------------------------------------

interface AnalyticsWordCloudProps {
  data: ChartInsight[];
  maxWords?: number;
  className?: string;
  onWordClick?: (text: string) => void;
  /** External ref to the container div, e.g. for PNG export. */
  containerRef?: RefObject<HTMLDivElement | null>;
}

// -- Component ---------------------------------------------------------------

export function AnalyticsWordCloud({
  data,
  maxWords = 50,
  className,
  onWordClick,
  containerRef: externalRef,
}: AnalyticsWordCloudProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(600);
  const [containerHeight, setContainerHeight] = useState(300);

  useImperativeHandle(externalRef, () => internalRef.current!);

  useEffect(() => {
    const el = internalRef.current;
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;
    const measure = (width: number, height: number) => {
      if (width > 0) setContainerWidth(Math.min(600, Math.floor(width)));
      if (height > 0) setContainerHeight(Math.max(160, Math.floor(height)));
    };
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const rect = entries[0]?.contentRect;
        if (rect) measure(rect.width, rect.height);
      }, 150);
    });

    observer.observe(el);
    measure(el.clientWidth, el.clientHeight);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, []);

  const words = useMemo(
    () =>
      data.slice(0, maxWords).map((insight) => ({
        text: insight.text,
        value: insight.nTimes,
      })),
    [data, maxWords],
  );

  const fontSize = useMemo(() => {
    if (words.length === 0) return () => 16;
    const max = Math.max(...words.map((w) => w.value));
    const min = Math.min(...words.map((w) => w.value));
    const range = max - min || 1;
    return (word: { text: string; value: number }) =>
      14 + ((word.value - min) / range) * 26;
  }, [words]);

  const fontWeight = useMemo(() => {
    if (words.length === 0) return () => "400" as const;
    const max = Math.max(...words.map((w) => w.value));
    const min = Math.min(...words.map((w) => w.value));
    const range = max - min || 1;
    return (word: { text: string; value: number }, _wordIndex: number) => {
      const normalized = (word.value - min) / range;
      if (normalized > 0.66) return "700";
      if (normalized > 0.33) return "600";
      return "400";
    };
  }, [words]);

  const fill = useMemo(
    () => (_word: { text: string; value: number }, index: number) =>
      WORD_COLORS[index % WORD_COLORS.length],
    [],
  );

  const handleWordClick = useMemo(() => {
    if (!onWordClick) return undefined;
    return (word: { text: string }, _index: number, _event: unknown) => {
      onWordClick(word.text);
    };
  }, [onWordClick]);

  if (words.length === 0) return null;

  return (
    <WordCloudErrorBoundary
      fallback={
        <div className="flex h-full min-h-[220px] items-center justify-center text-sm text-muted-foreground">
          Word cloud could not be rendered
        </div>
      }
    >
      <div
        ref={internalRef}
        className={cn(
          "h-full min-h-[220px] w-full overflow-hidden",
          onWordClick && "[&_text]:cursor-pointer [&_text:hover]:opacity-80",
          className,
        )}
        aria-hidden="true"
      >
        <Suspense fallback={<Skeleton className="h-full w-full rounded-lg" />}>
          <WordCloudInner
            words={words}
            fontSize={fontSize}
            fontWeight={fontWeight}
            fill={fill}
            font="Inter, sans-serif"
            padding={4}
            rotate={() => 0}
            width={containerWidth}
            height={containerHeight}
            onWordClick={handleWordClick}
          />
        </Suspense>
      </div>
      {/* Keyboard-accessible word list (sibling of SVG container) */}
      <ul role="list" className="sr-only">
        {words.map((word) => (
          <li key={word.text}>
            {onWordClick ? (
              <button
                type="button"
                onClick={() => onWordClick(word.text)}
                aria-label={`${word.text}, ${word.value} occurrences`}
              >
                {word.text} ({word.value})
              </button>
            ) : (
              <span>
                {word.text}, {word.value} occurrences
              </span>
            )}
          </li>
        ))}
      </ul>
    </WordCloudErrorBoundary>
  );
}
