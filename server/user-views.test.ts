import { describe, expect, it } from "vitest";
import type { User } from "../drizzle/schema";
import { toPublicUser, toSelfUser } from "./user-views";

const databaseUser: User = {
  id: 7,
  openId: "local_private_identifier",
  email: "person@example.com",
  username: "person",
  passwordHash: "argon2-hash-that-must-never-leave-the-server",
  name: "Person",
  bio: null,
  avatar: null,
  country: null,
  age: null,
  role: "user",
  isVerified: false,
  emailVerified: false,
  isSuspended: false,
  isBanned: false,
  lastSignedIn: new Date(),
  lastSeenAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("user response projections", () => {
  it("never exposes password hashes or internal identity keys to the owner", () => {
    const result = toSelfUser(databaseUser);
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("openId");
    expect(result.email).toBe(databaseUser.email);
  });

  it("also keeps email private in public user responses", () => {
    const result = toPublicUser(databaseUser);
    expect(result).not.toHaveProperty("passwordHash");
    expect(result).not.toHaveProperty("openId");
    expect(result).not.toHaveProperty("email");
  });
});
