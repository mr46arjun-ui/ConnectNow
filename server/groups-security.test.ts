import { describe, expect, it } from "vitest";
import {
  canEndGroupCall,
  canAssignGroupRole,
  canInitiateGroupCall,
  canManageGroup,
  canRemoveGroupMember,
  filterValidMentionIds,
} from "./groups";

describe("group authorization rules", () => {
  it("limits staff actions to the three group staff tiers", () => {
    expect(canManageGroup("admin")).toBe(true);
    expect(canManageGroup("co_admin")).toBe(true);
    expect(canManageGroup("moderator")).toBe(true);
    expect(canManageGroup("member")).toBe(false);
    expect(canManageGroup(null)).toBe(false);
  });

  it("protects creators and enforces the role hierarchy", () => {
    expect(canRemoveGroupMember("admin", "member", 1, 2, 1)).toBe(true);
    expect(canRemoveGroupMember("moderator", "member", 3, 2, 1)).toBe(true);
    expect(canRemoveGroupMember("moderator", "admin", 3, 1, 1)).toBe(false);
    expect(canRemoveGroupMember("moderator", "co_admin", 3, 2, 1)).toBe(false);
    expect(canRemoveGroupMember("co_admin", "moderator", 5, 3, 1)).toBe(true);
    expect(canRemoveGroupMember("co_admin", "co_admin", 5, 2, 1)).toBe(false);
    expect(canRemoveGroupMember("admin", "co_admin", 1, 5, 1)).toBe(true);
    expect(canRemoveGroupMember("admin", "member", 1, 1, 1)).toBe(false);
    expect(canRemoveGroupMember("member", "member", 4, 2, 1)).toBe(false);
  });

  it("allows only the initiator or a group manager to end a call", () => {
    expect(canEndGroupCall(7, 7, "member")).toBe(true);
    expect(canEndGroupCall(8, 7, "admin")).toBe(true);
    expect(canEndGroupCall(8, 7, "co_admin")).toBe(true);
    expect(canEndGroupCall(8, 7, "moderator")).toBe(true);
    expect(canEndGroupCall(8, 7, "member")).toBe(false);
    expect(canEndGroupCall(0, 0, "admin")).toBe(false);
  });

  it("authorizes call initiation only for Admin, Co-Admin, and Moderator", () => {
    expect(canInitiateGroupCall("admin")).toBe(true);
    expect(canInitiateGroupCall("co_admin")).toBe(true);
    expect(canInitiateGroupCall("moderator")).toBe(true);
    expect(canInitiateGroupCall("member")).toBe(false);
  });

  it("enforces staff promotion hierarchy", () => {
    expect(canAssignGroupRole("admin", "member", "co_admin", 1, 2, 1)).toBe(
      true
    );
    expect(canAssignGroupRole("co_admin", "member", "co_admin", 2, 3, 1)).toBe(
      true
    );
    expect(canAssignGroupRole("co_admin", "moderator", "member", 2, 3, 1)).toBe(
      true
    );
    expect(canAssignGroupRole("co_admin", "co_admin", "member", 2, 4, 1)).toBe(
      false
    );
    expect(
      canAssignGroupRole("moderator", "member", "moderator", 3, 4, 1)
    ).toBe(false);
    expect(canAssignGroupRole("admin", "member", "moderator", 1, 1, 1)).toBe(
      false
    );
  });
});

describe("group mentions", () => {
  const members = [
    { userId: 1, username: "sender", name: "Sender" },
    { userId: 2, username: "alex", name: "Alex" },
    { userId: 3, username: null, name: "OAuth User" },
    { userId: 4, username: "mia_4", name: "Mia" },
  ];

  it("accepts only requested group members whose handles appear in text", () => {
    expect(
      filterValidMentionIds(
        "Hello Alex and user3 — please ask mia_4.",
        [2, 3, 4, 999],
        members,
        1
      )
    ).toEqual([2, 3, 4]);
  });

  it("rejects sender self-tags, partial handles, and forged IDs", () => {
    expect(
      filterValidMentionIds("@sender @alexander", [1, 2, 999], members, 1)
    ).toEqual([]);
  });
});
