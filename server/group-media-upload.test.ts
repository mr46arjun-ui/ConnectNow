import { describe, expect, it } from "vitest";
import {
  AUDIO_EXTENSIONS,
  MAX_VOICE_NOTE_BYTES,
  REQUEST_ID_PATTERN,
  publicLocalFileName,
} from "./group-media-upload";

describe("group voice-note upload contract", () => {
  it("maps recorder MIME types to stable audio file extensions", () => {
    expect(AUDIO_EXTENSIONS.get("audio/webm")).toBe("webm");
    expect(AUDIO_EXTENSIONS.get("audio/ogg")).toBe("ogg");
    expect(AUDIO_EXTENSIONS.get("audio/mp4")).toBe("m4a");
    expect(MAX_VOICE_NOTE_BYTES).toBe(4 * 1024 * 1024);
  });

  it("builds deterministic retry-safe local file names", () => {
    expect(publicLocalFileName(12, 34, "voice_request_20260805", "webm")).toBe(
      "12-34-voice_request_20260805.webm"
    );
  });

  it("accepts UUID-style request ids and rejects path traversal", () => {
    expect(
      REQUEST_ID_PATTERN.test("8dd2e8c2-1f18-4b66-a1e8-22de13c04625")
    ).toBe(true);
    expect(REQUEST_ID_PATTERN.test("../../voice-note")).toBe(false);
  });
});
