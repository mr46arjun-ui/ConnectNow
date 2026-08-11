import { describe, expect, it } from "vitest";
import { validateDatabaseUrl } from "./_core/env";

const renderProduction = { isProduction: true, isRender: true };

describe("database environment validation", () => {
  it("explains why localhost cannot be used by a Render web service", () => {
    expect(
      validateDatabaseUrl(
        "mysql://connectnow:secret@localhost:3306/connectnow",
        renderProduction
      )
    ).toContain("localhost is the app container");
    expect(
      validateDatabaseUrl(
        "mysql://connectnow:secret@127.0.0.1:3306/connectnow",
        renderProduction
      )
    ).toContain("reachable external MySQL URL");
  });

  it("accepts reachable MySQL hosts and Docker Compose service names", () => {
    expect(
      validateDatabaseUrl(
        "mysql://connectnow:secret@mysql.example.com:3306/connectnow",
        renderProduction
      )
    ).toBeNull();
    expect(
      validateDatabaseUrl("mysql://connectnow:secret@db:3306/connectnow", {
        isProduction: true,
        isRender: false,
      })
    ).toBeNull();
  });

  it("rejects missing, malformed, and non-MySQL production URLs", () => {
    expect(validateDatabaseUrl("", renderProduction)).toContain("required");
    expect(validateDatabaseUrl("not a url", renderProduction)).toContain(
      "valid MySQL"
    );
    expect(
      validateDatabaseUrl(
        "postgresql://user:secret@example.com/connectnow",
        renderProduction
      )
    ).toContain("mysql://");
    expect(
      validateDatabaseUrl("mysql://user:secret@example.com", renderProduction)
    ).toContain("database name");
  });
});
