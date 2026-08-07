import { describe, expect, it } from "vitest";
import {
  getPublicErrorMessage,
  PUBLIC_INTERNAL_ERROR_MESSAGE,
} from "./_core/trpc";

describe("public API errors", () => {
  it("does not expose database query details for internal errors", () => {
    const rawDatabaseError =
      "Failed query: select `passwordHash` from `users` where `email` = ?";

    expect(
      getPublicErrorMessage("INTERNAL_SERVER_ERROR", rawDatabaseError)
    ).toBe(PUBLIC_INTERNAL_ERROR_MESSAGE);
    expect(
      getPublicErrorMessage("INTERNAL_SERVER_ERROR", rawDatabaseError)
    ).not.toContain("select");
  });

  it("preserves safe, intentional application errors", () => {
    expect(getPublicErrorMessage("CONFLICT", "Email already registered")).toBe(
      "Email already registered"
    );
  });
});
