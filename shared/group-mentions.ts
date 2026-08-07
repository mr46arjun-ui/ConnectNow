export type MentionRange = {
  start: number;
  end: number;
  query: string;
};

function escapeRegularExpression(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function contentMentionsHandle(content: string, handle: string) {
  return new RegExp(
    `(?:^|\\s)@?${escapeRegularExpression(handle)}(?![A-Za-z0-9_-])`,
    "i"
  ).test(content);
}

export function getMentionRange(
  value: string,
  cursor: number
): MentionRange | null {
  const prefix = value.slice(0, cursor);
  const match = prefix.match(/(?:^|\s)@?([A-Za-z0-9_-]+)$/);
  if (!match) return null;
  const query = match[1] ?? "";
  const tokenStart = cursor - query.length;
  const hasOptionalAt = value[tokenStart - 1] === "@";
  return {
    start: hasOptionalAt ? tokenStart - 1 : tokenStart,
    end: cursor,
    query,
  };
}

export function insertMentionAtRange(
  value: string,
  range: MentionRange,
  handle: string
) {
  const tail = value.slice(range.end);
  const separator = tail === "" || !/^[\s.,!?;:)]/.test(tail) ? " " : "";
  const text = `${value.slice(0, range.start)}${handle}${separator}${tail}`;
  return {
    text,
    cursor: range.start + handle.length + separator.length,
  };
}
