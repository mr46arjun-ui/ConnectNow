import { describe, expect, it, vi } from "vitest";
import {
  areMatchTypesCompatible,
  getMatchingQueueCounts,
  resolveSocketIdentity,
} from "./socket";

describe("anonymous socket identity", () => {
  it("does not verify a token or query the users table", async () => {
    const consume = vi.fn().mockResolvedValue({ allowed: true, count: 1 });
    const verifySession = vi.fn();
    const getUserByOpenId = vi.fn();

    const identity = await resolveSocketIdentity(
      {
        mode: "anonymous",
        ip: "127.0.0.1",
        cookieHeader: "app_session=must-not-be-read",
      },
      {
        consume,
        verifySession,
        getUserByOpenId,
      }
    );

    expect(identity.isAnonymous).toBe(true);
    expect(identity.databaseUserId).toBeNull();
    expect(identity.user).toBeNull();
    expect(String(identity.participantId)).toMatch(/^anon_/);
    expect(consume).toHaveBeenCalledOnce();
    expect(verifySession).not.toHaveBeenCalled();
    expect(getUserByOpenId).not.toHaveBeenCalled();
  });

  it("still applies an IP connection limit", async () => {
    await expect(
      resolveSocketIdentity(
        { mode: "anonymous", ip: "127.0.0.1" },
        {
          consume: vi.fn().mockResolvedValue({
            allowed: false,
            count: 21,
          }),
          verifySession: vi.fn(),
          getUserByOpenId: vi.fn(),
        }
      )
    ).rejects.toThrow("Too many anonymous connections");
  });

  it("restores a persistent guest as an authenticated database identity", async () => {
    const guestUser = {
      id: 42,
      openId: "guest_persistent-token",
      username: "NightGuest",
      name: "NightGuest",
      isBanned: false,
      isSuspended: false,
    };
    const identity = await resolveSocketIdentity(
      {
        mode: "authenticated",
        ip: "127.0.0.1",
        cookieHeader: "app_session_id=signed-guest-token",
      },
      {
        consume: vi.fn(),
        verifySession: vi.fn().mockResolvedValue({
          openId: guestUser.openId,
          appId: "connectnow-tests",
          name: guestUser.name,
        }),
        getUserByOpenId: vi.fn().mockResolvedValue(guestUser as any),
      }
    );

    expect(identity.isAnonymous).toBe(false);
    expect(identity.databaseUserId).toBe(42);
    expect(identity.participantId).toBe(42);
    expect(identity.displayName).toBe("NightGuest");
  });
});

describe("real-time matchmaking", () => {
  it("only pairs visitors requesting the same conversation type", () => {
    expect(
      areMatchTypesCompatible({ sessionType: "text" }, { sessionType: "text" })
    ).toBe(true);
    expect(
      areMatchTypesCompatible({ sessionType: "text" }, { sessionType: "video" })
    ).toBe(false);
    expect(
      areMatchTypesCompatible(
        { sessionType: "voice" },
        { sessionType: "video" }
      )
    ).toBe(false);
  });

  it("reports only SEARCHING participants in each matching pool", () => {
    expect(
      getMatchingQueueCounts([
        { sessionType: "text" },
        { sessionType: "text" },
        { sessionType: "voice" },
      ])
    ).toEqual({
      context: "random_matching_queue",
      matchingState: "SEARCHING",
      counts: { text: 2, voice: 1, video: 0 },
      total: 3,
    });
  });
});
