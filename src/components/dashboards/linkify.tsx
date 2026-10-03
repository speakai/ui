import type { ReactNode } from "react";

const LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)|https?:\/\/[^\s<>"]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"\]}]$/;

/** Returns the URL only when it parses as http(s); otherwise null. */
function safeHttpUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    return url.protocol === "http:" || url.protocol === "https:" ? raw : null;
  } catch {
    return null;
  }
}

/** Trims sentence punctuation and an unbalanced closing paren off a bare URL. */
function trimBareUrl(raw: string): string {
  let url = raw;
  for (;;) {
    if (TRAILING_PUNCTUATION.test(url)) {
      url = url.slice(0, -1);
    } else if (url.endsWith(")") && (url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)) {
      url = url.slice(0, -1);
    } else {
      return url;
    }
  }
}

function renderAnchor(href: string, label: string, key: number): ReactNode {
  return (
    <a
      key={key}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80"
    >
      {label}
    </a>
  );
}

/** Turns bare http(s) URLs and [text](url) links into anchors; everything else stays plain text. */
export function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;

  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index ?? 0;
    const [full, mdLabel, mdUrl] = match;

    let consumed = full;
    let anchor: ReactNode = null;
    if (mdLabel !== undefined) {
      const href = safeHttpUrl(mdUrl);
      if (href) anchor = renderAnchor(href, mdLabel, start);
    } else {
      const href = trimBareUrl(full);
      consumed = href;
      if (safeHttpUrl(href)) anchor = renderAnchor(href, href, start);
    }

    if (!anchor) continue;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(anchor);
    cursor = start + consumed.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}
