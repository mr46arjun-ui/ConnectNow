import { describe, expect, it } from "vitest";
import {
  contentMentionsHandle,
  getMentionRange,
  insertMentionAtRange,
} from "../shared/group-mentions";

describe("group mention composer", () => {
  it("detects direct member-name input without requiring an at sign", () => {
    expect(getMentionRange("Hello al", 8)).toEqual({
      start: 6,
      end: 8,
      query: "al",
    });
    expect(getMentionRange("Hello @al", 9)).toEqual({
      start: 6,
      end: 9,
      query: "al",
    });
    expect(getMentionRange("email@example.com", 17)).toBeNull();
  });

  it("replaces only the active mention search", () => {
    expect(
      insertMentionAtRange(
        "Hello @al, welcome",
        { start: 6, end: 9, query: "al" },
        "alex"
      )
    ).toEqual({
      text: "Hello alex, welcome",
      cursor: 10,
    });
  });

  it("matches full handles case-insensitively without partial collisions", () => {
    expect(contentMentionsHandle("Hello Alex!", "alex")).toBe(true);
    expect(contentMentionsHandle("Hello @Alex!", "alex")).toBe(true);
    expect(contentMentionsHandle("Hello @alexander", "alex")).toBe(false);
    expect(contentMentionsHandle("alex@example.com", "example")).toBe(false);
  });
});
