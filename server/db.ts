import {
  eq,
  and,
  or,
  inArray,
  desc,
  asc,
  like,
  lte,
  gte,
  lt,
  sql,
} from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import {
  InsertUser,
  users,
  userProfiles,
  InsertUserProfile,
  matchingPreferences,
  InsertMatchingPreference,
  friendRequests,
  InsertFriendRequest,
  friends,
  InsertFriend,
  blockedUsers,
  InsertBlockedUser,
  chatSessions,
  InsertChatSession,
  messages,
  InsertMessage,
  privateMessages,
  InsertPrivateMessage,
  reports,
  InsertReport,
  contentFlags,
  InsertContentFlag,
  notifications,
  InsertNotification,
  moderationLogs,
  InsertModerationLog,
  onlineStatus,
  InsertOnlineStatus,
  userInterests,
  InsertUserInterest,
  analyticsEvents,
  InsertAnalyticsEvent,
  messageReactions,
  InsertMessageReaction,
  passwordResetTokens,
  InsertPasswordResetToken,
  mediaUploads,
  InsertMediaUpload,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import { sanitizeContent } from "./moderation";

let _db: ReturnType<typeof drizzle> | null = null;

function createDatabaseClient(databaseUrl: string) {
  const parsed = new URL(databaseUrl);
  const sslMode = parsed.searchParams.get("ssl-mode")?.toLowerCase();
  const sslEnabled =
    process.env.DB_SSL === "true" ||
    parsed.searchParams.get("ssl") === "true" ||
    (sslMode !== undefined && sslMode !== "disabled");
  const sslCa = process.env.DB_SSL_CA?.replace(/\\n/g, "\n").trim();
  const configuredLimit = Number.parseInt(
    process.env.DB_CONNECTION_LIMIT ?? "",
    10
  );
  const connectionLimit =
    Number.isInteger(configuredLimit) &&
    configuredLimit >= 1 &&
    configuredLimit <= 50
      ? configuredLimit
      : 10;

  const pool = mysql.createPool({
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\/+/, "")),
    waitForConnections: true,
    connectionLimit,
    maxIdle: connectionLimit,
    idleTimeout: 60_000,
    queueLimit: 0,
    connectTimeout: 10_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ...(sslEnabled
      ? sslCa
        ? { ssl: { ca: sslCa } }
        : { ssl: { rejectUnauthorized: false } }
      : {}),
  });
  return drizzle(pool);
}

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = createDatabaseClient(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============================================================================
// USER QUERIES
// ============================================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "username"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}
export async function updateUser(id: number, updates: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return undefined;

  await db.update(users).set(updates).where(eq(users.id, id));
  return getUserById(id);
}

/**
 * Insert a local-auth user (email/password) and return its id.
 * Email verification starts false; passwordHash must be set by the caller.
 */
export async function createLocalUser(input: {
  openId: string;
  email: string;
  username?: string | null;
  name?: string | null;
  passwordHash: string;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: input.openId,
    email: input.email,
    username: input.username ?? null,
    name: input.name ?? null,
    passwordHash: input.passwordHash,
  });
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  return Number(insertId);
}

/** Create a persistent pseudonymous identity without email/password auth. */
export async function createGuestUser(input: {
  openId: string;
  username: string;
  name?: string | null;
}): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(users).values({
    openId: input.openId,
    email: null,
    username: input.username,
    name: input.name ?? input.username,
    role: "user",
    isVerified: false,
    emailVerified: false,
  });
  const insertId = (result as any).insertId ?? (result as any)[0]?.insertId;
  return Number(insertId);
}

export async function getOnlineUsers() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select({
      id: users.id,
      userId: users.id,
      username: users.username,
      name: users.name,
      avatar: users.avatar,
      role: users.role,
      isVerified: users.isVerified,
      status: onlineStatus.status,
      lastSeen: onlineStatus.lastSeen,
    })
    .from(onlineStatus)
    .innerJoin(users, eq(users.id, onlineStatus.userId))
    .where(eq(onlineStatus.status, "online"))
    .limit(1000);
}

// ============================================================================
// USER PROFILE QUERIES
// ============================================================================

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateUserProfile(
  userId: number,
  profile: Partial<InsertUserProfile>
) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getUserProfile(userId);
  if (existing) {
    await db
      .update(userProfiles)
      .set(profile)
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({ userId, ...profile });
  }
  return getUserProfile(userId);
}

// ============================================================================
// MATCHING PREFERENCES QUERIES
// ============================================================================

export async function getMatchingPreferences(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(matchingPreferences)
    .where(eq(matchingPreferences.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createOrUpdateMatchingPreferences(
  userId: number,
  prefs: Partial<InsertMatchingPreference>
) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await getMatchingPreferences(userId);
  if (existing) {
    await db
      .update(matchingPreferences)
      .set(prefs)
      .where(eq(matchingPreferences.userId, userId));
  } else {
    await db.insert(matchingPreferences).values({ userId, ...prefs });
  }
  return getMatchingPreferences(userId);
}

// ============================================================================
// FRIEND QUERIES
// ============================================================================

export async function sendFriendRequest(senderId: number, receiverId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .insert(friendRequests)
    .values({ senderId, receiverId, status: "pending" });
  return result;
}

export async function acceptFriendRequest(requestId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const request = await db
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId))
    .limit(1);

  if (!request.length) return undefined;

  const req = request[0];
  if (req.receiverId !== userId) return undefined;

  // Update request status
  await db
    .update(friendRequests)
    .set({ status: "accepted" })
    .where(eq(friendRequests.id, requestId));

  // Create friendship (store with lower id first for consistency)
  const user1Id = Math.min(req.senderId, req.receiverId);
  const user2Id = Math.max(req.senderId, req.receiverId);

  await db.insert(friends).values({ userId1: user1Id, userId2: user2Id });

  return req;
}

export async function rejectFriendRequest(requestId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const request = await db
    .select()
    .from(friendRequests)
    .where(eq(friendRequests.id, requestId))
    .limit(1);

  if (!request.length || request[0].receiverId !== userId) return undefined;

  await db
    .update(friendRequests)
    .set({ status: "rejected" })
    .where(eq(friendRequests.id, requestId));
  return request[0];
}

export async function getFriendRequests(
  userId: number,
  status: "pending" | "accepted" | "rejected" = "pending"
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(friendRequests)
    .where(
      and(
        eq(friendRequests.receiverId, userId),
        eq(friendRequests.status, status)
      )
    )
    .orderBy(desc(friendRequests.createdAt))
    .limit(100);
}

export async function getFriendsList(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // friendships are stored with the lower id as userId1 (canonical ordering).
  const friendships = await db
    .select()
    .from(friends)
    .where(or(eq(friends.userId1, userId), eq(friends.userId2, userId)))
    .limit(1000);

  const friendIds = friendships.map(f =>
    f.userId1 === userId ? f.userId2 : f.userId1
  );

  if (friendIds.length === 0) return [];

  return db
    .select()
    .from(users)
    .where(inArray(users.id, friendIds))
    .limit(1000);
}

export async function getBlockedUsersForCaller(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ blockedId: blockedUsers.blockedId })
    .from(blockedUsers)
    .where(eq(blockedUsers.blockerId, userId));
}

export async function getUsersWhoBlockedCaller(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ id: users.id })
    .from(users)
    .innerJoin(blockedUsers, eq(blockedUsers.blockerId, users.id))
    .where(eq(blockedUsers.blockedId, userId));
}

export async function removeFriend(userId1: number, userId2: number) {
  const db = await getDb();
  if (!db) return undefined;

  const id1 = Math.min(userId1, userId2);
  const id2 = Math.max(userId1, userId2);

  await db
    .delete(friends)
    .where(and(eq(friends.userId1, id1), eq(friends.userId2, id2)));
}

export async function canUsersMessage(userId1: number, userId2: number) {
  if (userId1 === userId2) return false;
  const db = await getDb();
  if (!db) return false;

  const lowerId = Math.min(userId1, userId2);
  const higherId = Math.max(userId1, userId2);
  const [friendship, blocked] = await Promise.all([
    db
      .select({ id: friends.id })
      .from(friends)
      .where(and(eq(friends.userId1, lowerId), eq(friends.userId2, higherId)))
      .limit(1),
    db
      .select({ id: blockedUsers.id })
      .from(blockedUsers)
      .where(
        or(
          and(
            eq(blockedUsers.blockerId, userId1),
            eq(blockedUsers.blockedId, userId2)
          ),
          and(
            eq(blockedUsers.blockerId, userId2),
            eq(blockedUsers.blockedId, userId1)
          )
        )
      )
      .limit(1),
  ]);

  return friendship.length > 0 && blocked.length === 0;
}

// ============================================================================
// BLOCKED USERS QUERIES
// ============================================================================

export async function blockUser(
  blockerId: number,
  blockedId: number,
  reason?: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(blockedUsers).values({ blockerId, blockedId, reason });
}

export async function unblockUser(blockerId: number, blockedId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .delete(blockedUsers)
    .where(
      and(
        eq(blockedUsers.blockerId, blockerId),
        eq(blockedUsers.blockedId, blockedId)
      )
    );
}

export async function getBlockedUsers(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const blocked = await db
    .select()
    .from(blockedUsers)
    .where(eq(blockedUsers.blockerId, userId))
    .limit(1000);

  const blockedIds = blocked.map(b => b.blockedId);
  if (blockedIds.length === 0) return [];

  return db.select().from(users).where(inArray(users.id, blockedIds));
}

export async function isUserBlocked(blockerId: number, userId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(blockedUsers)
    .where(
      and(
        eq(blockedUsers.blockerId, blockerId),
        eq(blockedUsers.blockedId, userId)
      )
    )
    .limit(1);

  return result.length > 0;
}

// ============================================================================
// CHAT SESSION QUERIES
// ============================================================================

export async function createChatSession(
  user1Id: number,
  user2Id: number,
  sessionType: "text" | "voice" | "video"
) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .insert(chatSessions)
    .values({ user1Id, user2Id, sessionType, status: "active" });
  return result;
}

export async function endChatSession(sessionId: number, duration: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(chatSessions)
    .set({ status: "ended", endedAt: new Date(), duration })
    .where(eq(chatSessions.id, sessionId));
}

export async function getChatSession(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================================
// MESSAGE QUERIES
// ============================================================================

export async function createMessage(
  sessionId: number,
  senderId: number,
  receiverId: number,
  content: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const sanitizedContent = sanitizeContent(content);

  const result = await db
    .insert(messages)
    .values({ sessionId, senderId, receiverId, content: sanitizedContent, isRead: false });

  // Atomic-ish bump of messageCount. Cheap MySQL trick: increment by 1 instead
  // of doing O(n) select-then-update, which is what the buggy version did.
  await db
    .update(chatSessions)
    .set({ messageCount: sql`${chatSessions.messageCount} + 1` })
    .where(eq(chatSessions.id, sessionId));

  return result;
}

export async function getSessionMessages(
  sessionId: number,
  limit: number = 100
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt))
    .limit(limit);
}

export async function markMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(messages.id, messageId));
}

// ============================================================================
// PRIVATE MESSAGE QUERIES
// ============================================================================

export async function createPrivateMessage(
  senderId: number,
  receiverId: number,
  content: string
) {
  const db = await getDb();
  if (!db) return undefined;

  const sanitizedContent = sanitizeContent(content);

  return db
    .insert(privateMessages)
    .values({ senderId, receiverId, content: sanitizedContent, isRead: false });
}

export async function getPrivateMessages(
  user1Id: number,
  user2Id: number,
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(privateMessages)
    .where(
      or(
        and(
          eq(privateMessages.senderId, user1Id),
          eq(privateMessages.receiverId, user2Id)
        ),
        and(
          eq(privateMessages.senderId, user2Id),
          eq(privateMessages.receiverId, user1Id)
        )
      )
    )
    .orderBy(desc(privateMessages.createdAt))
    .limit(limit);
}

export async function markPrivateMessageAsRead(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(privateMessages)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(privateMessages.id, messageId));
}

// ============================================================================
// REPORT QUERIES
// ============================================================================

export async function createReport(
  reporterId: number,
  reportedUserId: number,
  reason: string,
  description?: string,
  sessionId?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(reports).values({
    reporterId,
    reportedUserId,
    reason,
    description,
    sessionId,
    status: "pending",
  });
}

export async function getReports(
  status: "pending" | "reviewing" | "resolved" | "dismissed" = "pending",
  limit: number = 50
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(reports)
    .where(eq(reports.status, status))
    .orderBy(asc(reports.createdAt))
    .limit(limit);
}

export async function updateReport(
  reportId: number,
  updates: Partial<{
    status: "pending" | "reviewing" | "resolved" | "dismissed";
    action: "none" | "warning" | "suspend" | "ban";
    moderatorId: number;
    moderationNotes: string;
  }>
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.update(reports).set(updates).where(eq(reports.id, reportId));
}

// ============================================================================
// CONTENT FLAG QUERIES
// ============================================================================

export async function createContentFlag(
  messageId: number,
  flagReason: string,
  aiConfidence: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .insert(contentFlags)
    .values({ messageId, flagReason, aiConfidence, isHumanReviewed: false });
}

export async function getUnreviewedFlags(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(contentFlags)
    .where(eq(contentFlags.isHumanReviewed, false))
    .orderBy(desc(contentFlags.aiConfidence))
    .limit(limit);
}

export async function reviewContentFlag(
  flagId: number,
  verdict: "approved" | "rejected",
  moderatorId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(contentFlags)
    .set({
      isHumanReviewed: true,
      humanVerdict: verdict,
      moderatorId,
      reviewedAt: new Date(),
    })
    .where(eq(contentFlags.id, flagId));
}

// ============================================================================
// NOTIFICATION QUERIES
// ============================================================================

export async function createNotification(
  userId: number,
  type: "friend_request" | "message" | "system" | "report_update",
  title: string,
  content?: string,
  relatedUserId?: number,
  relatedItemId?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(notifications).values({
    userId,
    type,
    title,
    content,
    relatedUserId,
    relatedItemId,
    isRead: false,
  });
}

export async function getUserNotifications(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(
  notificationId: number,
  userId: number
) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      )
    );
}

// ============================================================================
// ONLINE STATUS QUERIES
// ============================================================================

export async function updateOnlineStatus(
  userId: number,
  status: "online" | "away" | "offline",
  currentSessionId?: number
) {
  const db = await getDb();
  if (!db) return undefined;

  const existing = await db
    .select()
    .from(onlineStatus)
    .where(eq(onlineStatus.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return db
      .update(onlineStatus)
      .set({ status, currentSessionId, lastSeen: new Date() })
      .where(eq(onlineStatus.userId, userId));
  } else {
    return db
      .insert(onlineStatus)
      .values({ userId, status, currentSessionId, lastSeen: new Date() });
  }
}

// ============================================================================
// MODERATION LOG QUERIES
// ============================================================================

export async function createModerationLog(
  moderatorId: number,
  action: string,
  targetUserId?: number,
  targetReportId?: number,
  reason?: string,
  details?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(moderationLogs).values({
    moderatorId,
    action,
    targetUserId,
    targetReportId,
    reason,
    details,
  });
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export async function trackAnalyticsEvent(
  userId: number | undefined,
  eventType: string,
  eventData?: Record<string, unknown>
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(analyticsEvents).values({ userId, eventType, eventData });
}

export async function editPrivateMessage(messageId: number, content: string) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(privateMessages)
    .set({ content, updatedAt: new Date() })
    .where(eq(privateMessages.id, messageId));
}

export async function deletePrivateMessage(messageId: number) {
  const db = await getDb();
  if (!db) return undefined;
  return db
    .update(privateMessages)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(privateMessages.id, messageId));
}

export async function addMessageReaction(
  messageId: number,
  userId: number,
  emoji: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(messageReactions).values({ messageId, userId, emoji });
}

export async function removeMessageReaction(
  messageId: number,
  userId: number,
  emoji: string
) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .delete(messageReactions)
    .where(
      and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId),
        eq(messageReactions.emoji, emoji)
      )
    );
}

export async function getMessageReactions(messageId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(messageReactions)
    .where(eq(messageReactions.messageId, messageId));
}

// ============================================================================
// PASSWORD RESET TOKEN QUERIES
// ============================================================================

export async function createPasswordResetToken(
  userId: number,
  token: string,
  expiresAt: Date
) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(passwordResetTokens).values({ userId, token, expiresAt });
}

export async function getPasswordResetToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function markPasswordResetTokenAsUsed(tokenId: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, tokenId));
}

export async function deleteExpiredPasswordResetTokens() {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .delete(passwordResetTokens)
    .where(lt(passwordResetTokens.expiresAt, new Date()));
}

export async function getUserPasswordResetTokens(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.userId, userId))
    .orderBy(desc(passwordResetTokens.createdAt));
}

// ============================================================================
// MEDIA UPLOAD QUERIES
// ============================================================================

export async function createMediaUpload(upload: InsertMediaUpload) {
  const db = await getDb();
  if (!db) return undefined;

  return db.insert(mediaUploads).values(upload);
}

export async function getMediaUpload(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(mediaUploads)
    .where(eq(mediaUploads.id, id))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getMessageMediaUploads(messageId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(mediaUploads)
    .where(
      and(
        eq(mediaUploads.messageId, messageId),
        eq(mediaUploads.isDeleted, false)
      )
    )
    .orderBy(desc(mediaUploads.createdAt));
}

export async function getGroupMessageMediaUploads(groupMessageId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(mediaUploads)
    .where(
      and(
        eq(mediaUploads.groupMessageId, groupMessageId),
        eq(mediaUploads.isDeleted, false)
      )
    )
    .orderBy(desc(mediaUploads.createdAt));
}

export async function getUserMediaUploads(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(mediaUploads)
    .where(
      and(
        eq(mediaUploads.uploadedBy, userId),
        eq(mediaUploads.isDeleted, false)
      )
    )
    .orderBy(desc(mediaUploads.createdAt))
    .limit(limit);
}

export async function deleteMediaUpload(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  return db
    .update(mediaUploads)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(eq(mediaUploads.id, id));
}

export async function getMediaUploadByS3Key(s3Key: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(mediaUploads)
    .where(eq(mediaUploads.s3Key, s3Key))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(users).limit(1000);
}

export async function getActiveMatchCandidates(userId: number, limit: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(users)
    .where(and(eq(users.isBanned, false), eq(users.isSuspended, false)))
    .limit(limit);
}

export async function countUsers(
  opts: { banned?: boolean; suspended?: boolean } = {}
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const filters = [];
  if (opts.banned !== undefined) {
    filters.push(eq(users.isBanned, opts.banned));
  }
  if (opts.suspended !== undefined) {
    filters.push(eq(users.isSuspended, opts.suspended));
  }
  const result = await db
    .select({ c: sql<number>`count(*)` })
    .from(users)
    .where(filters.length ? and(...filters) : undefined);
  return Number(result[0]?.c ?? 0);
}

export async function countOnlineUsers(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ c: sql<number>`count(*)` })
    .from(onlineStatus)
    .where(eq(onlineStatus.status, "online"));
  return Number(result[0]?.c ?? 0);
}

export async function countMessagesSince(since: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ c: sql<number>`count(*)` })
    .from(messages)
    .where(gte(messages.createdAt, since));
  return Number(result[0]?.c ?? 0);
}

export async function dailyActiveUsersSince(since: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ c: sql<number>`count(distinct senderId)` })
    .from(messages)
    .where(gte(messages.createdAt, since));
  return Number(result[0]?.c ?? 0);
}

export { getModerationStats, isSpam, containsProfanity } from "./moderation";
