export function getInitials(text: string, pick: "first-last" | "first-two" = "first-last"): string {
  const firsts = text
    .trim()
    .split(/\s+/)
    .map((word) => Array.from(word).find((ch) => /[\p{L}\p{N}]/u.test(ch)))
    .filter((ch): ch is string => !!ch);
  const picked = pick === "first-two" || firsts.length < 2 ? firsts.slice(0, 2) : [firsts[0], firsts[firsts.length - 1]];
  return picked.join("").toLocaleUpperCase();
}
