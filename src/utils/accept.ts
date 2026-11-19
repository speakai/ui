/**
 * Whether a file matches an `accept` string (e.g. "image/*,.pdf,text/csv"),
 * using the same rules as `<input type="file" accept>`: ".ext" matches the
 * file name ending, "type/*" matches the MIME type family, and anything else
 * must equal the MIME type. Case-insensitive. An empty `accept` allows all.
 */
export function matchesAccept(file: File, accept: string | undefined): boolean {
  const tokens = (accept ?? "")
    .split(",")
    .map((token) => token.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length === 0) return true;

  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}
