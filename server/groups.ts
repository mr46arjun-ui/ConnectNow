import {
  and,
  count,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";
import {
  groupBans,
  groupCallParticipants,
  groupCalls,
  groupInvites,
  groupMembers,
  groupMessageReactions,
  groupMessages,
  groups,
  notifications,
  users,
} from "../drizzle/schema";
import { contentMentionsHandle } from "../shared/group-mentions";
import { canUsersMessage, createNotification, getDb } from "./db";
import { sanitizeContent } from "./moderation";

export type GroupRole = "admin" | "co_admin" | "moderator" | "member";
export type GroupCallType = "audio" | "video";
export type GroupBanType = "temporary" | "permanent";

const MAX_GROUP_CALL_PARTICIPANTS = 6;

type MentionCandidate = {
  userId: number;
  username: string | null;
  name: string | null;
  avatar?: string | null;
};

function getInsertId(result: unknown) {
  const candidate =
    (result as { insertId?: unknown } | undefined)?.insertId ??
    (result as Array<{ insertId?: unknown }> | undefined)?.[0]?.insertId;
  const insertId = Number(candidate);
  return Number.isInteger(insertId) && insertId > 0 ? insertId : null;
}

function getAffectedRows(result: unknown) {
  const candidate =
    (result as { affectedRows?: unknown } | undefined)?.affectedRows ??
    (result as Array<{ affectedRows?: unknown }> | undefined)?.[0]
      ?.affectedRows;
  const affectedRows = Number(candidate);
  return Number.isInteger(affectedRows) && affectedRows >= 0
    ? affectedRows
    : null;
}

function mentionHandle(user: MentionCandidate) {
  return user.username?.trim() || `user${user.userId}`;
}

function displayName(user: MentionCandidate) {
  return user.name?.trim() || user.username?.trim() || `User ${user.userId}`;
}

export function canManageGroup(role: GroupRole | null | undefined) {
  return role === "admin" || role === "co_admin" || role === "moderator";
}

export function canManageGroupStaff(role: GroupRole | null | undefined) {
  return role === "admin" || role === "co_admin";
}

export function canInitiateGroupCall(role: GroupRole | null | undefined) {
  return canManageGroup(role);
}

export function canEndGroupCall(
  actorId: number,
  initiatorId: number,
  role: GroupRole | null | undefined
) {
  return actorId > 0 && (actorId === initiatorId || canManageGroup(role));
}

export function canRemoveGroupMember(
  actorRole: GroupRole,
  targetRole: GroupRole,
  actorId: number,
  targetId: number,
  creatorId: number
) {
  if (actorId === targetId || targetId === creatorId) return false;
  if (actorRole === "admin") return targetRole !== "admin";
  if (actorRole === "co_admin") {
    return targetRole === "moderator" || targetRole === "member";
  }
  return actorRole === "moderator" && targetRole === "member";
}

export function canAssignGroupRole(
  actorRole: GroupRole,
  targetRole: GroupRole,
  nextRole: Exclude<GroupRole, "admin">,
  actorId: number,
  targetId: number,
  creatorId: number
) {
  if (actorId === targetId || targetId === creatorId) return false;
  if (actorRole === "admin") return targetRole !== "admin";
  if (actorRole !== "co_admin" || targetRole === "admin" || targetRole === "co_admin") {
    return false;
  }
  return nextRole === "co_admin" || nextRole === "moderator" || nextRole === "member";
}

export function filterValidMentionIds(
  content: string,
  requestedIds: number[],
  members: MentionCandidate[],
  senderId: number
) {
  const requested = new Set(
    requestedIds.filter(id => Number.isInteger(id) && id > 0 && id !== senderId)
  );
  return members
    .filter(
      member =>
        requested.has(member.userId) &&
        contentMentionsHandle(content, mentionHandle(member))
    )
    .map(member => member.userId);
}

async function refreshMemberCount(
  database: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  groupId: number
) {
  const members = await database
    .select({ value: count() })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId));
  await database
    .update(groups)
    .set({
      memberCount: Number(members[0]?.value ?? 0),
      updatedAt: new Date(),
    })
    .where(eq(groups.id, groupId));
}

export async function getGroupMembership(groupId: number, userId: number) {
  if (userId <= 0) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return (
    (
      await database
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.userId, userId)
          )
        )
        .limit(1)
    )[0] ?? null
  );
}

export async function isGroupMember(groupId: number, userId: number) {
  return Boolean(await getGroupMembership(groupId, userId));
}

export async function getActiveGroupBan(groupId: number, userId: number) {
  if (userId <= 0) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return (
    (
      await database
        .select()
        .from(groupBans)
        .where(
          and(
            eq(groupBans.groupId, groupId),
            eq(groupBans.userId, userId),
            or(
              eq(groupBans.banType, "permanent"),
              and(eq(groupBans.banType, "temporary"), gt(groupBans.expiresAt, new Date()))
            )
          )
        )
        .limit(1)
    )[0] ?? null
  );
}

export async function isGroupUserBanned(groupId: number, userId: number) {
  return Boolean(await getActiveGroupBan(groupId, userId));
}

export async function createGroup(
  creatorId: number,
  input: { name: string; description?: string; password?: string; isPrivate?: boolean }
) {
  if (creatorId <= 0) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const passwordHash = input.password?.trim() ? input.password.trim() : null;

  const groupId = await database.transaction(async transaction => {
    const result = await transaction.insert(groups).values({
      name: input.name,
      description: input.description || null,
      createdBy: creatorId,
      memberCount: 1,
      passwordHash,
      isPrivate: Boolean(input.isPrivate || passwordHash),
      isActive: true,
    });
    const id = getInsertId(result);
    if (!id) throw new Error("Database did not return a group id");
    await transaction.insert(groupMembers).values({
      groupId: id,
      userId: creatorId,
      role: "admin",
    });
    return id;
  });

  return getGroupForMember(groupId, creatorId);
}

export async function listPublicGroups() {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      avatar: groups.avatar,
      createdBy: groups.createdBy,
      memberCount: groups.memberCount,
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
      isPrivate: groups.isPrivate,
      currentRole: sql<string>`'member'`,
      lastReadMessageId: sql<number | null>`null`,
    })
    .from(groups)
    .where(and(eq(groups.isActive, true), eq(groups.isPrivate, false)))
    .orderBy(desc(groups.updatedAt))
    .limit(100);
}

export async function getGroupById(groupId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return (
    (
      await database
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          avatar: groups.avatar,
          createdBy: groups.createdBy,
          memberCount: groups.memberCount,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
          isPrivate: groups.isPrivate,
          currentRole: sql<string>`'member'`,
          lastReadMessageId: sql<number | null>`null`,
        })
        .from(groups)
        .where(
          and(
            eq(groups.id, groupId),
            eq(groups.isActive, true),
            eq(groups.isPrivate, false)
          )
        )
        .limit(1)
    )[0] ?? null
  );
}

export async function listUserGroups(userId: number) {
  if (userId <= 0) return listPublicGroups();
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const memberships = await database
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      avatar: groups.avatar,
      createdBy: groups.createdBy,
      memberCount: groups.memberCount,
      createdAt: groups.createdAt,
      updatedAt: groups.updatedAt,
      isPrivate: groups.isPrivate,
      currentRole: groupMembers.role,
      lastReadMessageId: groupMembers.lastReadMessageId,
    })
    .from(groupMembers)
    .innerJoin(
      groups,
      and(eq(groups.id, groupMembers.groupId), eq(groups.isActive, true))
    )
    .where(eq(groupMembers.userId, userId))
    .orderBy(desc(groups.updatedAt));
  const publicGroups = await listPublicGroups();
  const merged = new Map(publicGroups.map(group => [group.id, group]));
  for (const membership of memberships) merged.set(membership.id, membership);
  const updatedTime = (value: Date | string | null | undefined) => {
    if (value instanceof Date) return value.getTime();
    if (!value) return 0;
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return [...merged.values()].sort(
    (a, b) => updatedTime(b.updatedAt) - updatedTime(a.updatedAt)
  );
}

export async function getGroupForMember(groupId: number, userId: number) {
  if (userId <= 0) return getGroupById(groupId);
  if (await isGroupUserBanned(groupId, userId)) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const memberGroup = (
    await database
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        avatar: groups.avatar,
        createdBy: groups.createdBy,
        memberCount: groups.memberCount,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        isPrivate: groups.isPrivate,
        currentRole: groupMembers.role,
        lastReadMessageId: groupMembers.lastReadMessageId,
      })
      .from(groupMembers)
      .innerJoin(
        groups,
        and(eq(groups.id, groupMembers.groupId), eq(groups.isActive, true))
      )
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .limit(1)
  )[0] ?? null;

  return memberGroup || getGroupById(groupId);
}

export async function canAccessGroup(groupId: number, userId: number) {
  return Boolean(await getGroupForMember(groupId, userId));
}

/** Add an authenticated visitor to a public group on first live entry. */
export async function ensurePublicGroupMembership(groupId: number, userId: number) {
  if (userId <= 0 || (await isGroupUserBanned(groupId, userId))) return false;
  if (await isGroupMember(groupId, userId)) return true;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const publicGroup = await database
    .select({ id: groups.id })
    .from(groups)
    .where(
      and(
        eq(groups.id, groupId),
        eq(groups.isActive, true),
        eq(groups.isPrivate, false)
      )
    )
    .limit(1);
  if (publicGroup.length === 0) return false;
  await database
    .insert(groupMembers)
    .values({ groupId, userId, role: "member" })
    .onDuplicateKeyUpdate({ set: { userId } });
  await refreshMemberCount(database, groupId);
  return true;
}

export async function listGroupMembers(groupId: number, callerId: number) {
  if (!(await canAccessGroup(groupId, callerId))) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database
    .select({
      membershipId: groupMembers.id,
      userId: users.id,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
      isVerified: users.isVerified,
      role: groupMembers.role,
      joinedAt: groupMembers.joinedAt,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(groupMembers.joinedAt);
}

export async function getGroupMessageReactions(groupId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const rows = await database
    .select({
      id: groupMessageReactions.id,
      messageId: groupMessageReactions.messageId,
      userId: groupMessageReactions.userId,
      participantKey: groupMessageReactions.participantKey,
      emoji: groupMessageReactions.emoji,
    })
    .from(groupMessageReactions)
    .where(eq(groupMessageReactions.groupId, groupId));

  const map: Record<
    number,
    Array<{ id: number; userId: number; participantKey: string; emoji: string }>
  > = {};
  for (const row of rows) {
    if (!map[row.messageId]) map[row.messageId] = [];
    map[row.messageId].push(row);
  }
  return map;
}

export async function toggleMessageReaction(
  messageId: number,
  groupId: number,
  userId: number,
  participantKeyStr: string,
  emojiStr: string
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const emoji = emojiStr.slice(0, 32);
  const pKey = participantKeyStr.slice(0, 128);

  const existing = (
    await database
      .select({ id: groupMessageReactions.id })
      .from(groupMessageReactions)
      .where(
        and(
          eq(groupMessageReactions.messageId, messageId),
          eq(groupMessageReactions.participantKey, pKey),
          eq(groupMessageReactions.emoji, emoji)
        )
      )
      .limit(1)
  )[0];

  if (existing) {
    await database
      .delete(groupMessageReactions)
      .where(eq(groupMessageReactions.id, existing.id));
  } else {
    await database.insert(groupMessageReactions).values({
      messageId,
      groupId,
      userId,
      participantKey: pKey,
      emoji,
    });
  }

  const updated = await database
    .select({
      id: groupMessageReactions.id,
      userId: groupMessageReactions.userId,
      participantKey: groupMessageReactions.participantKey,
      emoji: groupMessageReactions.emoji,
    })
    .from(groupMessageReactions)
    .where(eq(groupMessageReactions.messageId, messageId));

  return { messageId, groupId, reactions: updated };
}

export async function listGroupMessages(
  groupId: number,
  callerId: number,
  limit: number = 80
) {
  if (!(await canAccessGroup(groupId, callerId))) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const reactionsMap = await getGroupMessageReactions(groupId);
  const rows = await database
    .select({
      id: groupMessages.id,
      groupId: groupMessages.groupId,
      senderId: groupMessages.senderId,
      senderUsername: users.username,
      senderName: users.name,
      senderAvatar: users.avatar,
      content: groupMessages.content,
      messageType: groupMessages.messageType,
      mediaUrl: groupMessages.mediaUrl,
      mentions: groupMessages.mentions,
      isEdited: groupMessages.isEdited,
      timestamp: groupMessages.timestamp,
    })
    .from(groupMessages)
    .leftJoin(users, eq(users.id, groupMessages.senderId))
    .where(
      and(
        eq(groupMessages.groupId, groupId),
        eq(groupMessages.isDeleted, false)
      )
    )
    .orderBy(desc(groupMessages.id))
    .limit(limit);

  return rows.reverse().map(row => ({
    ...row,
    messageType: row.messageType ?? "text",
    mediaUrl: row.mediaUrl ?? null,
    senderUsername: row.senderUsername ?? null,
    senderName: row.senderName ?? null,
    senderAvatar: row.senderAvatar ?? null,
    senderHandle: row.senderUsername || (row.senderId === 0 ? "guest" : `user${row.senderId}`),
    senderDisplayName:
      row.senderName || row.senderUsername || (row.senderId === 0 ? "Guest Visitor" : `User ${row.senderId}`),
    mentions: Array.isArray(row.mentions) ? row.mentions : [],
    reactions: reactionsMap[row.id] ?? [],
  }));
}

export async function createGroupMessage(
  groupId: number,
  senderId: number,
  content: string,
  requestedMentionIds: number[],
  guestDisplayName?: string,
  messageType: "text" | "image" | "video" | "file" | "audio" = "text",
  mediaUrl?: string
) {
  if (!(await canAccessGroup(groupId, senderId))) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const memberRows = await database
    .select({
      userId: users.id,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));

  const sanitizedContent = sanitizeContent(content);
  const mentionIds = filterValidMentionIds(
    sanitizedContent,
    requestedMentionIds,
    memberRows,
    senderId
  );
  const messageId = await database.transaction(async transaction => {
    const result = await transaction.insert(groupMessages).values({
      groupId,
      senderId,
      content: sanitizedContent,
      mentions: mentionIds,
      messageType,
      mediaUrl: mediaUrl ?? null,
    });
    const id = getInsertId(result);
    if (!id) throw new Error("Database did not return a group message id");
    await transaction
      .update(groups)
      .set({ updatedAt: new Date() })
      .where(eq(groups.id, groupId));
    return id;
  });

  const sender = memberRows.find(member => member.userId === senderId);
  const senderHandle = sender
    ? mentionHandle(sender)
    : senderId === 0
      ? "guest"
      : `user${senderId}`;
  const senderDisplayName = sender
    ? displayName(sender)
    : guestDisplayName || (senderId === 0 ? "Guest Visitor" : `User ${senderId}`);
  const timestamp = new Date();

  const group = (
    await database
      .select({ name: groups.name })
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1)
  )[0];

  const notificationResults = await Promise.allSettled(
    mentionIds.map(mentionedUserId =>
      createNotification(
        mentionedUserId,
        "message",
        `You were mentioned in ${group?.name ?? "the group"}`,
        `${senderDisplayName}: ${content.slice(0, 180)}`,
        senderId,
        groupId
      )
    )
  );
  if (notificationResults.some(result => result.status === "rejected")) {
    console.error("[Groups] One or more mention notifications were not saved");
  }

  return {
    groupName: group?.name ?? "Group",
    message: {
      id: messageId,
      groupId,
      senderId,
      senderUsername: sender?.username ?? null,
      senderName: sender?.name ?? null,
      senderAvatar: sender?.avatar ?? null,
      senderHandle,
      senderDisplayName,
      content: sanitizedContent,
      messageType,
      mediaUrl: mediaUrl ?? null,
      mentions: mentionIds,
      reactions: [],
      isEdited: false,
      timestamp,
    },
    mentionedUserIds: mentionIds,
  };
}

export async function updateGroupDetails(
  groupId: number,
  actorId: number,
  input: { name?: string; description?: string }
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const group = (
    await database
      .select({ createdBy: groups.createdBy })
      .from(groups)
      .where(and(eq(groups.id, groupId), eq(groups.isActive, true)))
      .limit(1)
  )[0];
  if (!group || actorId <= 0 || group.createdBy !== actorId) return false;
  await database
    .update(groups)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description || null }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(groups.id, groupId), eq(groups.isActive, true)));
  return true;
}

export async function inviteGroupMember(
  groupId: number,
  actorId: number,
  invitedUserId: number
) {
  const membership = await getGroupMembership(groupId, actorId);
  if (!canManageGroupStaff(membership?.role)) return false;
  if (!(await canUsersMessage(actorId, invitedUserId))) return false;
  if (await isGroupMember(groupId, invitedUserId)) return true;

  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const existing = await database
    .select({ id: groupInvites.id })
    .from(groupInvites)
    .where(
      and(
        eq(groupInvites.groupId, groupId),
        eq(groupInvites.invitedUserId, invitedUserId),
        eq(groupInvites.status, "pending")
      )
    )
    .limit(1);
  if (existing.length > 0) return true;

  await database.insert(groupInvites).values({
    groupId,
    invitedUserId,
    invitedBy: actorId,
    status: "pending",
  });
  const group = await getGroupForMember(groupId, actorId);
  const inviter = await database
    .select({ id: users.id, username: users.username, name: users.name })
    .from(users)
    .where(eq(users.id, actorId))
    .limit(1);
  await createNotification(
    invitedUserId,
    "system",
    `Invitation to ${group?.name ?? "a group"}`,
    `${inviter[0]?.name || inviter[0]?.username || "A friend"} invited you to join`,
    actorId,
    groupId
  );
  return true;
}

export async function listGroupInvites(userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  return database
    .select({
      id: groupInvites.id,
      groupId: groups.id,
      groupName: groups.name,
      groupAvatar: groups.avatar,
      invitedBy: groupInvites.invitedBy,
      inviterUsername: users.username,
      inviterName: users.name,
      createdAt: groupInvites.createdAt,
    })
    .from(groupInvites)
    .innerJoin(
      groups,
      and(eq(groups.id, groupInvites.groupId), eq(groups.isActive, true))
    )
    .innerJoin(users, eq(users.id, groupInvites.invitedBy))
    .where(
      and(
        eq(groupInvites.invitedUserId, userId),
        eq(groupInvites.status, "pending")
      )
    )
    .orderBy(desc(groupInvites.createdAt));
}

export async function respondToGroupInvite(
  inviteId: number,
  userId: number,
  accept: boolean
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const invite = (
    await database
      .select()
      .from(groupInvites)
      .where(
        and(
          eq(groupInvites.id, inviteId),
          eq(groupInvites.invitedUserId, userId),
          eq(groupInvites.status, "pending")
        )
      )
      .limit(1)
  )[0];
  if (!invite) return null;
  if (accept) {
    const activeGroup = await database
      .select({ id: groups.id })
      .from(groups)
      .where(and(eq(groups.id, invite.groupId), eq(groups.isActive, true)))
      .limit(1);
    if (activeGroup.length === 0) return null;
  }

  const invitationChanged = await database.transaction(async transaction => {
    const updateResult = await transaction
      .update(groupInvites)
      .set({
        status: accept ? "accepted" : "rejected",
        respondedAt: new Date(),
      })
      .where(
        and(
          eq(groupInvites.id, inviteId),
          eq(groupInvites.invitedUserId, userId),
          eq(groupInvites.status, "pending")
        )
      );
    if (getAffectedRows(updateResult) !== 1) return false;
    if (accept) {
      await transaction
        .insert(groupMembers)
        .values({
          groupId: invite.groupId,
          userId,
          role: "member",
        })
        .onDuplicateKeyUpdate({ set: { userId } });
    }
    return true;
  });
  if (!invitationChanged) return null;
  if (accept) await refreshMemberCount(database, invite.groupId);
  return { groupId: invite.groupId, accepted: accept };
}

export async function removeMemberFromGroup(
  groupId: number,
  actorId: number,
  targetId: number
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const group = await getGroupForMember(groupId, actorId);
  const actor = await getGroupMembership(groupId, actorId);
  const target = await getGroupMembership(groupId, targetId);
  if (!group || !actor || !target) return false;
  if (
    !canRemoveGroupMember(
      actor.role,
      target.role,
      actorId,
      targetId,
      group.createdBy
    )
  ) {
    return false;
  }
  await database
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetId))
    );
  await refreshMemberCount(database, groupId);
  return true;
}

export async function setGroupMemberRole(
  groupId: number,
  actorId: number,
  targetId: number,
  nextRole: Exclude<GroupRole, "admin">
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const group = await getGroupForMember(groupId, actorId);
  const actor = await getGroupMembership(groupId, actorId);
  const target = await getGroupMembership(groupId, targetId);
  if (!group || !actor || !target) return false;
  if (
    !canAssignGroupRole(
      actor.role,
      target.role,
      nextRole,
      actorId,
      targetId,
      group.createdBy
    )
  ) {
    return false;
  }
  await database
    .update(groupMembers)
    .set({ role: nextRole })
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetId))
    );
  return true;
}

export async function banGroupMember(
  groupId: number,
  actorId: number,
  targetId: number,
  input: {
    banType: GroupBanType;
    durationMinutes?: number;
    reason?: string;
  }
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const group = await getGroupForMember(groupId, actorId);
  const actor = await getGroupMembership(groupId, actorId);
  const target = await getGroupMembership(groupId, targetId);
  if (!group || !actor || !target) return false;
  if (
    !canRemoveGroupMember(
      actor.role,
      target.role,
      actorId,
      targetId,
      group.createdBy
    )
  ) {
    return false;
  }

  const expiresAt =
    input.banType === "temporary"
      ? new Date(Date.now() + Math.max(1, input.durationMinutes ?? 60) * 60_000)
      : null;
  const now = new Date();
  const activeCalls = await database
    .select({ id: groupCalls.id, initiatorId: groupCalls.initiatorId })
    .from(groupCalls)
    .where(and(eq(groupCalls.groupId, groupId), isNull(groupCalls.endedAt)));

  await database.transaction(async transaction => {
    await transaction
      .insert(groupBans)
      .values({
        groupId,
        userId: targetId,
        bannedBy: actorId,
        banType: input.banType,
        reason: input.reason?.trim() || null,
        expiresAt,
      })
      .onDuplicateKeyUpdate({
        set: {
          bannedBy: actorId,
          banType: input.banType,
          reason: input.reason?.trim() || null,
          expiresAt,
          updatedAt: now,
        },
      });
    await transaction
      .delete(groupMembers)
      .where(
        and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, targetId))
      );

    for (const call of activeCalls) {
      if (call.initiatorId === targetId) {
        await transaction
          .update(groupCalls)
          .set({
            endedAt: now,
            participantCount: 0,
            duration: sql`GREATEST(TIMESTAMPDIFF(SECOND, ${groupCalls.startedAt}, ${now}), 0)`,
          })
          .where(and(eq(groupCalls.id, call.id), isNull(groupCalls.endedAt)));
        await transaction
          .update(groupCallParticipants)
          .set({ leftAt: now })
          .where(
            and(
              eq(groupCallParticipants.groupCallId, call.id),
              isNull(groupCallParticipants.leftAt)
            )
          );
        continue;
      }
      const changed = await transaction
        .update(groupCallParticipants)
        .set({ leftAt: now })
        .where(
          and(
            eq(groupCallParticipants.groupCallId, call.id),
            eq(groupCallParticipants.userId, targetId),
            isNull(groupCallParticipants.leftAt)
          )
        );
      if (getAffectedRows(changed) === 1) {
        await transaction
          .update(groupCalls)
          .set({
            participantCount: sql`GREATEST(COALESCE(${groupCalls.participantCount}, 1) - 1, 0)`,
          })
          .where(and(eq(groupCalls.id, call.id), isNull(groupCalls.endedAt)));
        await transaction
          .update(groupCalls)
          .set({
            endedAt: now,
            duration: sql`GREATEST(TIMESTAMPDIFF(SECOND, ${groupCalls.startedAt}, ${now}), 0)`,
          })
          .where(
            and(
              eq(groupCalls.id, call.id),
              isNull(groupCalls.endedAt),
              sql`COALESCE(${groupCalls.participantCount}, 0) = 0`
            )
          );
      }
    }
  });
  await refreshMemberCount(database, groupId);
  return true;
}

export async function listGroupBans(groupId: number, actorId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const group = await database
    .select({ createdBy: groups.createdBy })
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.isActive, true)))
    .limit(1);
  if (group[0]?.createdBy !== actorId) return null;
  return database
    .select({
      id: groupBans.id,
      userId: groupBans.userId,
      username: users.username,
      name: users.name,
      bannedBy: groupBans.bannedBy,
      banType: groupBans.banType,
      reason: groupBans.reason,
      expiresAt: groupBans.expiresAt,
      createdAt: groupBans.createdAt,
    })
    .from(groupBans)
    .innerJoin(users, eq(users.id, groupBans.userId))
    .where(
      and(
        eq(groupBans.groupId, groupId),
        or(
          eq(groupBans.banType, "permanent"),
          and(eq(groupBans.banType, "temporary"), gt(groupBans.expiresAt, new Date()))
        )
      )
    )
    .orderBy(desc(groupBans.updatedAt));
}

export async function unbanGroupMember(
  groupId: number,
  actorId: number,
  targetId: number
) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const group = await database
    .select({ createdBy: groups.createdBy })
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.isActive, true)))
    .limit(1);
  if (group[0]?.createdBy !== actorId) return false;
  await database
    .delete(groupBans)
    .where(and(eq(groupBans.groupId, groupId), eq(groupBans.userId, targetId)));
  return true;
}

export async function leaveGroup(groupId: number, userId: number) {
  if (userId <= 0) return false;
  const group = await getGroupForMember(groupId, userId);
  if (!group || group.createdBy === userId) return false;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  await database
    .delete(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
  await refreshMemberCount(database, groupId);
  return true;
}

export async function markGroupRead(
  groupId: number,
  userId: number,
  messageId: number
) {
  if (userId <= 0) return false;
  if (!(await isGroupMember(groupId, userId))) return false;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const message = await database
    .select({ id: groupMessages.id })
    .from(groupMessages)
    .where(
      and(
        eq(groupMessages.id, messageId),
        eq(groupMessages.groupId, groupId),
        eq(groupMessages.isDeleted, false)
      )
    )
    .limit(1);
  if (message.length === 0) return false;
  await database
    .update(groupMembers)
    .set({ lastReadMessageId: messageId })
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId))
    );
  await database
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, userId),
        eq(notifications.type, "message"),
        eq(notifications.relatedItemId, groupId),
        eq(notifications.isRead, false)
      )
    );
  return true;
}

export async function deleteGroupMessage(messageId: number, actorId: number) {
  if (actorId <= 0) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const message = (
    await database
      .select()
      .from(groupMessages)
      .where(
        and(eq(groupMessages.id, messageId), eq(groupMessages.isDeleted, false))
      )
      .limit(1)
  )[0];
  if (!message) return null;
  const membership = await getGroupMembership(message.groupId, actorId);
  if (
    !membership ||
    (message.senderId !== actorId && !canManageGroup(membership.role))
  ) {
    return null;
  }
  await database
    .update(groupMessages)
    .set({ isDeleted: true, deletedAt: new Date() })
    .where(
      and(eq(groupMessages.id, messageId), ne(groupMessages.isDeleted, true))
    );
  return { groupId: message.groupId, messageId };
}

function toGroupCallSummary(call: {
  id: number;
  groupId: number;
  groupName: string;
  initiatorId: number;
  callType: GroupCallType;
  startedAt: Date;
  endedAt: Date | null;
  participantCount: number | null;
  maxParticipants: number | null;
}) {
  return {
    ...call,
    participantCount: call.participantCount ?? 0,
    maxParticipants: call.maxParticipants ?? MAX_GROUP_CALL_PARTICIPANTS,
  };
}

export async function getGroupCallForMember(callId: number, userId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const call = (
    await database
      .select({
        id: groupCalls.id,
        groupId: groupCalls.groupId,
        groupName: groups.name,
        initiatorId: groupCalls.initiatorId,
        callType: groupCalls.callType,
        startedAt: groupCalls.startedAt,
        endedAt: groupCalls.endedAt,
        participantCount: groupCalls.participantCount,
        maxParticipants: groupCalls.maxParticipants,
        currentRole: groupMembers.role,
      })
      .from(groupCalls)
      .innerJoin(groups, eq(groups.id, groupCalls.groupId))
      .innerJoin(
        groupMembers,
        and(
          eq(groupMembers.groupId, groupCalls.groupId),
          eq(groupMembers.userId, userId)
        )
      )
      .where(and(eq(groupCalls.id, callId), eq(groups.isActive, true)))
      .limit(1)
  )[0];
  if (!call) return null;
  return {
    ...toGroupCallSummary(call),
    currentRole: call.currentRole,
    canEnd: canEndGroupCall(userId, call.initiatorId, call.currentRole),
  };
}

export async function getActiveGroupCall(groupId: number, userId: number) {
  if (!(await isGroupMember(groupId, userId))) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const call = (
    await database
      .select({
        id: groupCalls.id,
        groupId: groupCalls.groupId,
        groupName: groups.name,
        initiatorId: groupCalls.initiatorId,
        callType: groupCalls.callType,
        startedAt: groupCalls.startedAt,
        endedAt: groupCalls.endedAt,
        participantCount: groupCalls.participantCount,
        maxParticipants: groupCalls.maxParticipants,
      })
      .from(groupCalls)
      .innerJoin(groups, eq(groups.id, groupCalls.groupId))
      .where(
        and(
          eq(groupCalls.groupId, groupId),
          isNull(groupCalls.endedAt),
          eq(groups.isActive, true)
        )
      )
      .orderBy(desc(groupCalls.id))
      .limit(1)
  )[0];
  return call ? toGroupCallSummary(call) : null;
}

export async function listGroupCallParticipants(
  callId: number,
  callerId: number
) {
  const call = await getGroupCallForMember(callId, callerId);
  if (!call || call.endedAt) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const participants = await database
    .select({
      userId: users.id,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
      joinedAt: groupCallParticipants.joinedAt,
    })
    .from(groupCallParticipants)
    .innerJoin(users, eq(users.id, groupCallParticipants.userId))
    .where(
      and(
        eq(groupCallParticipants.groupCallId, callId),
        isNull(groupCallParticipants.leftAt)
      )
    )
    .orderBy(groupCallParticipants.joinedAt);
  return participants.map(participant => ({
    ...participant,
    handle: participant.username || `user${participant.userId}`,
    displayName:
      participant.name || participant.username || `User ${participant.userId}`,
  }));
}

export async function startGroupCall(
  groupId: number,
  initiatorId: number,
  callType: GroupCallType
) {
  if (initiatorId <= 0) return null;
  const membership = await getGroupMembership(groupId, initiatorId);
  if (!canInitiateGroupCall(membership?.role)) return null;
  const group = await getGroupForMember(groupId, initiatorId);
  if (!group) return null;
  const existing = await getActiveGroupCall(groupId, initiatorId);
  if (existing) {
    return {
      call: existing,
      created: false,
      invitedUserIds: [] as number[],
    };
  }

  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const result = await database.insert(groupCalls).values({
    groupId,
    initiatorId,
    callType,
    participantCount: 0,
    maxParticipants: MAX_GROUP_CALL_PARTICIPANTS,
  });
  const callId = getInsertId(result);
  if (!callId) throw new Error("Database did not return a group call id");

  const memberRows = await database
    .select({
      userId: users.id,
      username: users.username,
      name: users.name,
    })
    .from(groupMembers)
    .innerJoin(users, eq(users.id, groupMembers.userId))
    .where(eq(groupMembers.groupId, groupId));
  const initiator = memberRows.find(member => member.userId === initiatorId);
  const initiatorName = initiator
    ? displayName(initiator)
    : `User ${initiatorId}`;
  const invitedUserIds = memberRows
    .map(member => member.userId)
    .filter(userId => userId !== initiatorId);

  const notificationResults = await Promise.allSettled(
    invitedUserIds.map(userId =>
      createNotification(
        userId,
        "system",
        `Group ${callType} call in ${group.name}`,
        `${initiatorName} started a ${callType} call`,
        initiatorId,
        groupId
      )
    )
  );
  if (notificationResults.some(result => result.status === "rejected")) {
    console.error(
      "[Groups] One or more group call notifications were not saved"
    );
  }

  return {
    call: {
      id: callId,
      groupId,
      groupName: group.name,
      initiatorId,
      callType,
      startedAt: new Date(),
      endedAt: null,
      participantCount: 0,
      maxParticipants: MAX_GROUP_CALL_PARTICIPANTS,
    },
    created: true,
    invitedUserIds,
  };
}

export async function joinGroupCall(callId: number, userId: number) {
  if (userId <= 0) return null;
  const call = await getGroupCallForMember(callId, userId);
  if (!call || call.endedAt) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");

  const existing = await database
    .select({ id: groupCallParticipants.id })
    .from(groupCallParticipants)
    .where(
      and(
        eq(groupCallParticipants.groupCallId, callId),
        eq(groupCallParticipants.userId, userId),
        isNull(groupCallParticipants.leftAt)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    const joined = await database.transaction(async transaction => {
      const updateResult = await transaction
        .update(groupCalls)
        .set({
          participantCount: sql`COALESCE(${groupCalls.participantCount}, 0) + 1`,
        })
        .where(
          and(
            eq(groupCalls.id, callId),
            isNull(groupCalls.endedAt),
            sql`COALESCE(${groupCalls.participantCount}, 0) < COALESCE(${groupCalls.maxParticipants}, ${MAX_GROUP_CALL_PARTICIPANTS})`
          )
        );
      if (getAffectedRows(updateResult) !== 1) return false;
      await transaction.insert(groupCallParticipants).values({
        groupCallId: callId,
        userId,
      });
      return true;
    });
    if (!joined) return { status: "full" as const, call, participants: [] };
  }

  const participants = await listGroupCallParticipants(callId, userId);
  return {
    status: "joined" as const,
    call,
    participants: participants ?? [],
  };
}

export async function canSignalGroupCall(
  callId: number,
  senderId: number,
  targetId: number
) {
  if (senderId <= 0 || targetId <= 0) return false;
  if (senderId === targetId) return false;
  const call = await getGroupCallForMember(callId, senderId);
  if (!call || call.endedAt) return false;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const active = await database
    .select({ userId: groupCallParticipants.userId })
    .from(groupCallParticipants)
    .where(
      and(
        eq(groupCallParticipants.groupCallId, callId),
        inArray(groupCallParticipants.userId, [senderId, targetId]),
        isNull(groupCallParticipants.leftAt)
      )
    );
  return new Set(active.map(row => row.userId)).size === 2;
}

export async function leaveGroupCall(callId: number, userId: number) {
  if (userId <= 0) return null;
  const call = await getGroupCallForMember(callId, userId);
  if (!call || call.endedAt) return null;
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const participant = (
    await database
      .select({
        id: groupCallParticipants.id,
        joinedAt: groupCallParticipants.joinedAt,
      })
      .from(groupCallParticipants)
      .where(
        and(
          eq(groupCallParticipants.groupCallId, callId),
          eq(groupCallParticipants.userId, userId),
          isNull(groupCallParticipants.leftAt)
        )
      )
      .limit(1)
  )[0];
  if (!participant) {
    return { callId, groupId: call.groupId, userId, ended: false };
  }

  const now = new Date();
  const duration = Math.max(
    0,
    Math.floor((now.getTime() - participant.joinedAt.getTime()) / 1_000)
  );
  const changed = await database.transaction(async transaction => {
    const updateResult = await transaction
      .update(groupCallParticipants)
      .set({ leftAt: now, duration })
      .where(
        and(
          eq(groupCallParticipants.id, participant.id),
          isNull(groupCallParticipants.leftAt)
        )
      );
    if (getAffectedRows(updateResult) !== 1) return false;
    await transaction
      .update(groupCalls)
      .set({
        participantCount: sql`GREATEST(COALESCE(${groupCalls.participantCount}, 1) - 1, 0)`,
      })
      .where(and(eq(groupCalls.id, callId), isNull(groupCalls.endedAt)));
    return true;
  });
  if (!changed) return null;

  const refreshed = await database
    .select({ participantCount: groupCalls.participantCount })
    .from(groupCalls)
    .where(eq(groupCalls.id, callId))
    .limit(1);
  const ended = Number(refreshed[0]?.participantCount ?? 0) === 0;
  if (ended) {
    await database
      .update(groupCalls)
      .set({
        endedAt: now,
        duration: Math.max(
          0,
          Math.floor((now.getTime() - call.startedAt.getTime()) / 1_000)
        ),
      })
      .where(and(eq(groupCalls.id, callId), isNull(groupCalls.endedAt)));
  }
  return { callId, groupId: call.groupId, userId, ended };
}

export async function endGroupCall(callId: number, actorId: number) {
  if (actorId <= 0) return null;
  const call = await getGroupCallForMember(callId, actorId);
  if (
    !call ||
    call.endedAt ||
    !canEndGroupCall(actorId, call.initiatorId, call.currentRole)
  ) {
    return null;
  }
  const database = await getDb();
  if (!database) throw new Error("Database not available");
  const now = new Date();
  await database.transaction(async transaction => {
    await transaction
      .update(groupCalls)
      .set({
        endedAt: now,
        duration: Math.max(
          0,
          Math.floor((now.getTime() - call.startedAt.getTime()) / 1_000)
        ),
        participantCount: 0,
      })
      .where(and(eq(groupCalls.id, callId), isNull(groupCalls.endedAt)));
    await transaction
      .update(groupCallParticipants)
      .set({ leftAt: now })
      .where(
        and(
          eq(groupCallParticipants.groupCallId, callId),
          isNull(groupCallParticipants.leftAt)
        )
      );
  });
  return { callId, groupId: call.groupId };
}

export async function cleanupStaleGroupCalls() {
  const database = await getDb();
  if (!database) return;
  const cutoff = new Date(Date.now() - 4 * 60 * 60 * 1_000);
  const now = new Date();
  await database
    .update(groupCalls)
    .set({ endedAt: now, participantCount: 0 })
    .where(and(isNull(groupCalls.endedAt), lt(groupCalls.startedAt, cutoff)));
  await database
    .update(groupCallParticipants)
    .set({ leftAt: now })
    .where(
      and(
        isNull(groupCallParticipants.leftAt),
        lt(groupCallParticipants.joinedAt, cutoff)
      )
    );
}

export async function deleteGroupPermanently(groupId: number) {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");
  await database.delete(groupBans).where(eq(groupBans.groupId, groupId));
  await database.delete(groupMembers).where(eq(groupMembers.groupId, groupId));
  await database.delete(groups).where(eq(groups.id, groupId));
  return { success: true };
}
