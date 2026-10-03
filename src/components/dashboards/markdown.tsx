import { Fragment, type ReactNode } from "react";
import { linkify } from "./linkify";

/**
 * Safe markdown subset for the notes widget. Content is parsed into React
 * elements only: raw HTML is never interpreted (React escapes it as text) and
 * links go through linkify, which allows http(s) URLs alone.
 */

type ListItem = { text: string; children: ListBlock | null };
type ListBlock = { type: "list"; ordered: boolean; start: number; items: ListItem[] };
type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "hr" }
  | { type: "quote"; blocks: Block[] }
  | ListBlock
  | { type: "table"; header: string[]; rows: string[][] }
  | { type: "paragraph"; text: string };

const HEADING = /^\s{0,3}(#{1,3})\s+(.+?)\s*#*\s*$/;
const HR = /^\s{0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE = /^\s{0,3}>\s?/;
const LIST_ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const TABLE_SEPARATOR = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

const isBlank = (line: string) => line.trim() === "";

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function startsTable(lines: string[], i: number): boolean {
  return lines[i].includes("|") && i + 1 < lines.length && lines[i + 1].includes("-") && TABLE_SEPARATOR.test(lines[i + 1]);
}

/** True when the line begins a block that may interrupt a paragraph. */
function interruptsParagraph(lines: string[], i: number): boolean {
  const line = lines[i];
  if (HEADING.test(line) || HR.test(line) || QUOTE.test(line) || startsTable(lines, i)) return true;
  const item = LIST_ITEM.exec(line);
  return item !== null && (/^[-*+]$/.test(item[2]) || item[2] === "1." || item[2] === "1)");
}

function buildList(rows: { indent: number; marker: string; text: string }[]): ListBlock {
  const baseIndent = rows[0].indent;
  const ordered = /\d/.test(rows[0].marker);
  const list: ListBlock = { type: "list", ordered, start: ordered ? parseInt(rows[0].marker, 10) : 1, items: [] };
  let nestedRows: typeof rows = [];

  const flushNested = () => {
    const last = list.items[list.items.length - 1];
    if (last && nestedRows.length) {
      // One nesting level: anything deeper is flattened into the nested list.
      const nestedBase = nestedRows[0].indent;
      last.children = buildList(nestedRows.map((r) => ({ ...r, indent: nestedBase })));
    }
    nestedRows = [];
  };

  for (const row of rows) {
    if (row.indent >= baseIndent + 2 && list.items.length) {
      nestedRows.push(row);
    } else {
      flushNested();
      list.items.push({ text: row.text, children: null });
    }
  }
  flushNested();
  return list;
}

function parseBlocks(source: string): Block[] {
  const lines = source.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) {
      i++;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length as 1 | 2 | 3, text: heading[2] });
      i++;
      continue;
    }

    if (HR.test(line)) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (QUOTE.test(line)) {
      const quoted: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) quoted.push(lines[i++].replace(QUOTE, ""));
      blocks.push({ type: "quote", blocks: parseBlocks(quoted.join("\n")) });
      continue;
    }

    if (startsTable(lines, i)) {
      const header = splitRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes("|")) rows.push(splitRow(lines[i++]));
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (LIST_ITEM.test(line)) {
      const rows: { indent: number; marker: string; text: string }[] = [];
      while (i < lines.length) {
        const item = LIST_ITEM.exec(lines[i]);
        if (item && !HR.test(lines[i])) {
          rows.push({ indent: item[1].replace(/\t/g, "    ").length, marker: item[2], text: item[3] });
          i++;
        } else if (isBlank(lines[i]) && i + 1 < lines.length && LIST_ITEM.test(lines[i + 1]) && !HR.test(lines[i + 1])) {
          i++;
        } else if (!isBlank(lines[i]) && /^\s+\S/.test(lines[i]) && !interruptsParagraph(lines, i)) {
          rows[rows.length - 1].text += `\n${lines[i].trim()}`;
          i++;
        } else {
          break;
        }
      }
      blocks.push(buildList(rows));
      continue;
    }

    const paragraph: string[] = [line];
    i++;
    while (i < lines.length && !isBlank(lines[i]) && !interruptsParagraph(lines, i)) paragraph.push(lines[i++]);
    blocks.push({ type: "paragraph", text: paragraph.join("\n") });
  }

  return blocks;
}

const INLINE = /`([^`\n]+)`|\*\*([^*\n]+?)\*\*|\*([^*\s][^*\n]*?)\*/g;

/** Renders `code`, **bold**, *italic*, bare URLs and [text](url) links. */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;
  const pushPlain = (segment: string) => {
    if (segment) nodes.push(<Fragment key={key++}>{linkify(segment)}</Fragment>);
  };

  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0;
    pushPlain(text.slice(cursor, start));
    const [, code, bold, italic] = match;
    if (code !== undefined) {
      nodes.push(
        <code key={key++} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground">
          {code}
        </code>,
      );
    } else if (bold !== undefined) {
      nodes.push(
        <strong key={key++} className="font-semibold text-foreground">
          {renderInline(bold)}
        </strong>,
      );
    } else {
      nodes.push(<em key={key++}>{renderInline(italic)}</em>);
    }
    cursor = start + match[0].length;
  }
  pushPlain(text.slice(cursor));
  return nodes;
}

const HEADING_CLASS = {
  1: "text-xl font-semibold text-foreground",
  2: "text-lg font-semibold text-foreground",
  3: "text-base font-semibold text-foreground",
} as const;

function renderList(list: ListBlock, key: number): ReactNode {
  const Tag = list.ordered ? "ol" : "ul";
  return (
    <Tag
      key={key}
      start={list.ordered && list.start !== 1 ? list.start : undefined}
      className={list.ordered ? "list-decimal space-y-1 pl-5" : "list-disc space-y-1 pl-5"}
    >
      {list.items.map((item, idx) => (
        <li key={idx} className="whitespace-pre-wrap">
          {renderInline(item.text)}
          {item.children ? <div className="mt-1">{renderList(item.children, 0)}</div> : null}
        </li>
      ))}
    </Tag>
  );
}

function renderBlock(block: Block, key: number): ReactNode {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h1" | "h2" | "h3";
      return (
        <Tag key={key} className={HEADING_CLASS[block.level]}>
          {renderInline(block.text)}
        </Tag>
      );
    }
    case "hr":
      return <hr key={key} className="border-border" />;
    case "quote":
      return (
        <blockquote key={key} className="space-y-2 border-l-2 border-border pl-3 italic">
          {block.blocks.map(renderBlock)}
        </blockquote>
      );
    case "list":
      return renderList(block, key);
    case "table":
      return (
        <div key={key} className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                {block.header.map((cell, idx) => (
                  <th key={idx} className="border-b border-border px-2 py-1 font-semibold text-foreground">
                    {renderInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {block.header.map((_, c) => (
                    <td key={c} className="border-b border-border px-2 py-1">
                      {renderInline(row[c] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "paragraph":
      return (
        <p key={key} className="whitespace-pre-wrap">
          {renderInline(block.text)}
        </p>
      );
  }
}

/** Renders a safe markdown subset as React elements; plain text renders as a single paragraph. */
export function renderMarkdown(source: string): ReactNode[] {
  return parseBlocks(source.replace(/\r\n?/g, "\n")).map(renderBlock);
}
