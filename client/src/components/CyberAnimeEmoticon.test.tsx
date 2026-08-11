import { describe, expect, it } from "vitest";
import {
  CYBER_EMOTICONS,
  CYBER_EMOTICON_TOKEN_PATTERN,
  cyberEmotionFromToken,
} from "./CyberAnimeEmoticon";

describe("Cyber HUD emoticon tokens", () => {
  it("keeps every production emotion mapped to a unique persisted token", () => {
    expect(CYBER_EMOTICONS).toHaveLength(132);
    expect(new Set(CYBER_EMOTICONS.map(item => item.token)).size).toBe(132);
    expect(new Set(CYBER_EMOTICONS.map(item => item.id)).size).toBe(132);
  });

  it("resolves known tokens without interpreting arbitrary message text", () => {
    expect(cyberEmotionFromToken(":cyber-surprised:")).toBe("surprised");
    expect(cyberEmotionFromToken(":cyber-unknown:")).toBeUndefined();
  });

  it("keeps six variants in every audited face family", () => {
    const familyCounts = new Map<string, number>();
    for (const item of CYBER_EMOTICONS) {
      familyCounts.set(item.face, (familyCounts.get(item.face) ?? 0) + 1);
    }

    expect(familyCounts.size).toBe(22);
    expect(new Set(familyCounts.values())).toEqual(new Set([6]));
  });

  it("covers the complete motion grammar and parses compound tokens", () => {
    expect(new Set(CYBER_EMOTICONS.map(item => item.motion))).toEqual(
      new Set([
        "idle",
        "pulse",
        "bounce",
        "glitch",
        "drift",
        "shake",
        "alert",
        "drip",
        "orbit",
        "scan",
      ])
    );
    expect(
      "hello :cyber-happy-halo: :cyber-sick-bandage:".match(
        CYBER_EMOTICON_TOKEN_PATTERN
      )
    ).toEqual([":cyber-happy-halo:", ":cyber-sick-bandage:"]);
  });
});
