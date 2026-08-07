import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { appRouter } from "./_core/appRouter";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function contextFor(user: AuthenticatedUser | null): TrpcContext {
  const headers: Record<string, string> = {};
  return {
    req: { protocol: "https", headers } as unknown as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
    user,
  };
}

const inMemoryDb = {
  users: new Map<string, AuthenticatedUser>(),
  passwordResets: new Map<string, { userId: number; expiresAt: Date; usedAt?: Date }>(),
};

vi.mock("./db", () => ({
  getUserByEmail: async (email: string) => {
    for (const u of inMemoryDb.users.values()) {
      if (u.email === email) return u;
    }
    return undefined;
  },
  getUserByUsername: async (username: string) => {
    for (const u of inMemoryDb.users.values()) {
      if (u.username === username) return u;
    }
    return undefined;
  },
  getUserById: async (id: number) => {
    for (const u of inMemoryDb.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  },
  getUserByOpenId: async (openId: string) => {
    return inMemoryDb.users.get(openId);
  },
  createLocalUser: async (input: any) => {
    const id = inMemoryDb.users.size + 1;
    const newUser = {
      id,
      openId: input.openId,
      email: input.email,
      username: input.username,
      name: input.name ?? null,
      passwordHash: input.passwordHash,
      role: "user",
      isVerified: false,
      emailVerified: false,
      isSuspended: false,
      isBanned: false,
      lastSignedIn: new Date(),
      lastSeenAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as AuthenticatedUser;
    inMemoryDb.users.set(newUser.openId, newUser);
    return id;
  },
  createGuestUser: async (input: any) => {
    const id = inMemoryDb.users.size + 1;
    const now = new Date();
    const newUser = {
      id,
      openId: input.openId,
      email: null,
      username: input.username,
      name: input.name ?? input.username,
      bio: null,
      avatar: null,
      country: null,
      age: null,
      passwordHash: null,
      role: "user",
      isVerified: false,
      emailVerified: false,
      isSuspended: false,
      isBanned: false,
      lastSignedIn: now,
      lastSeenAt: now,
      createdAt: now,
      updatedAt: now,
    } as AuthenticatedUser;
    inMemoryDb.users.set(newUser.openId, newUser);
    return id;
  },
  updateUser: async (id: number, updates: any) => {
    for (const [k, v] of inMemoryDb.users.entries()) {
      if (v.id === id) {
        const out = { ...v, ...updates };
        inMemoryDb.users.set(k, out);
        return out;
      }
    }
    return undefined;
  },
  createNotification: async () => undefined,
  sendFriendRequest: async () => undefined,
  blockUser: async () => undefined,
  unblockUser: async () => undefined,
  getBlockedUsers: async () => [] as any[],
  getBlocksByCaller: async () => [] as any[],
  isUserBlocked: async () => false,
  trackAnalyticsEvent: async () => undefined,
  createPasswordResetToken: async (userId: number, token: string, expiresAt: Date) => {
    inMemoryDb.passwordResets.set(token, { userId, expiresAt });
  },
  getPasswordResetToken: async (token: string) => {
    return inMemoryDb.passwordResets.get(token) ?? null;
  },
  markPasswordResetTokenAsUsed: async (token: string) => {
    const r = inMemoryDb.passwordResets.get(token);
    if (r) r.usedAt = new Date();
  },
  acceptFriendRequest: async () => ({ senderId: 99, receiverId: 1 }),
  rejectFriendRequest: async () => true,
  getFriendsList: async () => [],
  getFriendRequests: async () => [],
  removeFriend: async () => undefined,
  createMessage: async () => 1,
  createPrivateMessage: async () => 1,
  getPrivateMessages: async () => [],
  markPrivateMessageAsRead: async () => undefined,
  editPrivateMessage: async () => undefined,
  deletePrivateMessage: async () => undefined,
  addMessageReaction: async () => undefined,
  removeMessageReaction: async () => undefined,
  getMessageReactions: async () => [],
  getOnlineUsers: async () => [],
  createReport: async () => undefined,
  getReports: async () => [],
  updateReport: async () => undefined,
  createModerationLog: async () => undefined,
  countUsers: async () => 0,
  countOnlineUsers: async () => 0,
  countMessagesSince: async () => 0,
  dailyActiveUsersSince: async () => 0,
  getUserMediaUploads: async () => [],
  getMediaUpload: async () => undefined,
  deleteMediaUpload: async () => undefined,
  getMessageMediaUploads: async () => [],
  getGroupMessageMediaUploads: async () => [],
  createMediaUpload: async () => undefined,
  getDb: async () => null,
}));

beforeEach(() => {
  inMemoryDb.users.clear();
  inMemoryDb.passwordResets.clear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("auth.signup", () => {
  it("creates a user and sets a session cookie", async () => {
    const ctx = contextFor(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.signup({
      email: "foo@example.com",
      username: "foo",
      password: "Password123",
      name: "Foo",
    });
    expect(result.success).toBe(true);
    expect(typeof result.userId).toBe("number");
    expect(ctx.res.cookie).toHaveBeenCalled();
  });

  it("rejects weak passwords", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await expect(
      caller.auth.signup({
        email: "weak@example.com",
        username: "weak",
        password: "alllowercase",
      })
    ).rejects.toThrow(/letters and numbers|8-128/);
  });

  it("rejects duplicate emails", async () => {
    const caller = appRouter.createCaller(contextFor(null));
    await caller.auth.signup({
      email: "dup@example.com",
      username: "first",
      password: "Password123",
    });
    await expect(
      caller.auth.signup({
        email: "dup@example.com",
        username: "second",
        password: "Password123",
      })
    ).rejects.toThrow(/Email already/);
  });
});

describe("auth.startGuest", () => {
  it("creates a durable pseudonymous user and one-year session cookie", async () => {
    const ctx = contextFor(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.startGuest({ username: "NightGuest" });

    expect(result.success).toBe(true);
    expect(result.userId).toBe(1);
    expect(ctx.res.cookie).toHaveBeenCalledWith(
      "app_session_id",
      expect.any(String),
      expect.objectContaining({ httpOnly: true, maxAge: 31_536_000_000 })
    );
    const guest = Array.from(inMemoryDb.users.values())[0]!;
    expect(guest.openId).toMatch(/^guest_/);
    expect(guest.username).toBe("NightGuest");
  });

  it("rejects a guest name already used by another identity", async () => {
    const first = appRouter.createCaller(contextFor(null));
    await first.auth.startGuest({ username: "TakenGuest" });
    const second = appRouter.createCaller(contextFor(null));
    await expect(
      second.auth.startGuest({ username: "TakenGuest" })
    ).rejects.toThrow(/already in use/);
  });
});

describe("auth.login", () => {
  async function seedUser() {
    const caller = appRouter.createCaller(contextFor(null));
    await caller.auth.signup({
      email: "log@example.com",
      username: "logger",
      password: "Password123",
    });
  }

  it("logs in with the right password", async () => {
    await seedUser();
    const ctx = contextFor(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.login({
      email: "log@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
    expect(ctx.res.cookie).toHaveBeenCalled();
  });

  it("rejects wrong password without leaking which is wrong", async () => {
    await seedUser();
    const caller = appRouter.createCaller(contextFor(null));
    await expect(
      caller.auth.login({
        email: "log@example.com",
        password: "WrongPassword1",
      })
    ).rejects.toThrow(/Invalid credentials/);
  });
});

describe("auth.password reset", () => {
  it("completes a full reset flow", async () => {
    const seedCaller = appRouter.createCaller(contextFor(null));
    await seedCaller.auth.signup({
      email: "reset@example.com",
      username: "resetter",
      password: "Password123",
    });
    const requester = appRouter.createCaller(contextFor(null));
    const req = await requester.auth.requestPasswordReset({
      email: "reset@example.com",
    });
    expect(req.success).toBe(true);

    // We intercept the token via the in-memory mock store.
    const tokens = Array.from(inMemoryDb.passwordResets.keys());
    expect(tokens.length).toBe(1);
    const token = tokens[0]!;

    const resetCaller = appRouter.createCaller(contextFor(null));
    const result = await resetCaller.auth.resetPassword({
      token,
      newPassword: "NewPassword456",
    });
    expect(result.success).toBe(true);

    // Old password no longer works.
    const loginCaller = appRouter.createCaller(contextFor(null));
    await expect(
      loginCaller.auth.login({
        email: "reset@example.com",
        password: "Password123",
      })
    ).rejects.toThrow(/Invalid credentials/);

    // New password works.
    const loginCaller2 = appRouter.createCaller(contextFor(null));
    const ok = await loginCaller2.auth.login({
      email: "reset@example.com",
      password: "NewPassword456",
    });
    expect(ok.success).toBe(true);
  });
});

describe("auth.changePassword requires current password", () => {
  it("rejects an incorrect current password", async () => {
    const seedCaller = appRouter.createCaller(contextFor(null));
    await seedCaller.auth.signup({
      email: "change@example.com",
      username: "changer",
      password: "OldPassword1",
    });
    const userRecord = Array.from(inMemoryDb.users.values())[0]!;
    const ctx = contextFor(userRecord);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.changePassword({
        currentPassword: "WrongPassword1",
        newPassword: "NewPassword456",
      })
    ).rejects.toThrow(/Current password/);
  });
});
