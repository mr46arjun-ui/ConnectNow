import {
  int,
  varchar,
  text,
  timestamp,
  datetime,
  mysqlEnum,
  mysqlTable,
  boolean,
  decimal,
  json,
  index,
  unique,
  primaryKey,
  tinyint,
} from "drizzle-orm/mysql-core";

/**
 * Core Users Table
 * Stores authentication and basic user information
 */
export const users = mysqlTable(
  "users",
  {
    id: int("id").autoincrement().primaryKey(),
    openId: varchar("openId", { length: 64 }).notNull().unique(),
    email: varchar("email", { length: 320 }).unique(),
    username: varchar("username", { length: 64 }).unique(),
    passwordHash: varchar("passwordHash", { length: 255 }),
    name: text("name"),
    bio: text("bio"),
    avatar: varchar("avatar", { length: 512 }), // S3 URL
    country: varchar("country", { length: 64 }),
    age: int("age"),
    role: mysqlEnum("role", ["user", "admin", "moderator"]).default("user").notNull(),
    isVerified: boolean("isVerified").default(false),
    emailVerified: boolean("emailVerified").default(false),
    isSuspended: boolean("isSuspended").default(false),
    isBanned: boolean("isBanned").default(false),
    lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
    lastSeenAt: timestamp("lastSeenAt").defaultNow().notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    emailIdx: index("email_idx").on(table.email),
    usernameIdx: index("username_idx").on(table.username),
    roleIdx: index("role_idx").on(table.role),
  })
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User Profiles Table
 * Extended profile information with interests and preferences
 */
export const userProfiles = mysqlTable(
  "user_profiles",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    interests: json("interests").$type<string[]>().default([]),
    languages: json("languages").$type<string[]>().default([]),
    verificationBadge: boolean("verificationBadge").default(false),
    verificationDate: timestamp("verificationDate"),
    profileCompleteness: int("profileCompleteness").default(0), // 0-100
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Matching Preferences Table
 * Stores user's filter preferences for random chat matching
 */
export const matchingPreferences = mysqlTable(
  "matching_preferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    genderFilter: varchar("genderFilter", { length: 64 }), // "male", "female", "any"
    countryFilter: json("countryFilter").$type<string[]>().default([]), // Empty = all countries
    languageFilter: json("languageFilter").$type<string[]>().default([]), // Empty = all languages
    ageMin: int("ageMin").default(18),
    ageMax: int("ageMax").default(65),
    interestTags: json("interestTags").$type<string[]>().default([]), // Empty = all interests
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("user_id_idx").on(table.userId),
  })
);

export type MatchingPreference = typeof matchingPreferences.$inferSelect;
export type InsertMatchingPreference = typeof matchingPreferences.$inferInsert;

/**
 * Friend Requests Table
 * Tracks pending friend requests between users
 */
export const friendRequests = mysqlTable(
  "friend_requests",
  {
    id: int("id").autoincrement().primaryKey(),
    senderId: int("senderId").notNull(),
    receiverId: int("receiverId").notNull(),
    status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    senderIdx: index("sender_idx").on(table.senderId),
    receiverIdx: index("receiver_idx").on(table.receiverId),
    statusIdx: index("status_idx").on(table.status),
    uniqueRequest: unique("unique_request").on(table.senderId, table.receiverId),
  })
);

export type FriendRequest = typeof friendRequests.$inferSelect;
export type InsertFriendRequest = typeof friendRequests.$inferInsert;

/**
 * Friends Table
 * Stores accepted friendships
 */
export const friends = mysqlTable(
  "friends",
  {
    id: int("id").autoincrement().primaryKey(),
    userId1: int("userId1").notNull(),
    userId2: int("userId2").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    user1Idx: index("user1_idx").on(table.userId1),
    user2Idx: index("user2_idx").on(table.userId2),
    uniqueFriendship: unique("unique_friendship").on(table.userId1, table.userId2),
  })
);

export type Friend = typeof friends.$inferSelect;
export type InsertFriend = typeof friends.$inferInsert;

/**
 * Blocked Users Table
 * Tracks users that have been blocked
 */
export const blockedUsers = mysqlTable(
  "blocked_users",
  {
    id: int("id").autoincrement().primaryKey(),
    blockerId: int("blockerId").notNull(),
    blockedId: int("blockedId").notNull(),
    reason: text("reason"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    blockerIdx: index("blocker_idx").on(table.blockerId),
    blockedIdx: index("blocked_idx").on(table.blockedId),
    uniqueBlock: unique("unique_block").on(table.blockerId, table.blockedId),
  })
);

export type BlockedUser = typeof blockedUsers.$inferSelect;
export type InsertBlockedUser = typeof blockedUsers.$inferInsert;

/**
 * Chat Sessions Table
 * Tracks all chat sessions (text, voice, video)
 */
export const chatSessions = mysqlTable(
  "chat_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    user1Id: int("user1Id").notNull(),
    user2Id: int("user2Id").notNull(),
    sessionType: mysqlEnum("sessionType", ["text", "voice", "video"]).notNull(),
    status: mysqlEnum("status", ["active", "ended"]).default("active").notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    endedAt: timestamp("endedAt"),
    duration: int("duration"), // in seconds
    messageCount: int("messageCount").default(0),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    user1Idx: index("user1_idx").on(table.user1Id),
    user2Idx: index("user2_idx").on(table.user2Id),
    statusIdx: index("status_idx").on(table.status),
    typeIdx: index("type_idx").on(table.sessionType),
  })
);

export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = typeof chatSessions.$inferInsert;

/**
 * Messages Table
 * Stores all text messages in chat sessions
 */
export const messages = mysqlTable(
  "messages",
  {
    id: int("id").autoincrement().primaryKey(),
    sessionId: int("sessionId").notNull(),
    senderId: int("senderId").notNull(),
    receiverId: int("receiverId").notNull(),
    content: text("content").notNull(),
    isRead: boolean("isRead").default(false),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    sessionIdx: index("session_idx").on(table.sessionId),
    senderIdx: index("sender_idx").on(table.senderId),
    receiverIdx: index("receiver_idx").on(table.receiverId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Private Messages Table
 * Stores direct messages between friends
 */
export const privateMessages = mysqlTable(
  "private_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    senderId: int("senderId").notNull(),
    receiverId: int("receiverId").notNull(),
    content: text("content").notNull(),
    isRead: boolean("isRead").default(false),
    readAt: timestamp("readAt"),
    isDeleted: boolean("isDeleted").default(false),
    isEdited: boolean("isEdited").default(false),
    editedAt: timestamp("editedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    senderIdx: index("sender_idx").on(table.senderId),
    receiverIdx: index("receiver_idx").on(table.receiverId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export type PrivateMessage = typeof privateMessages.$inferSelect;
export type InsertPrivateMessage = typeof privateMessages.$inferInsert;

/**
 * Reports Table
 * Tracks user reports for moderation
 */
export const reports = mysqlTable(
  "reports",
  {
    id: int("id").autoincrement().primaryKey(),
    reporterId: int("reporterId").notNull(),
    reportedUserId: int("reportedUserId").notNull(),
    sessionId: int("sessionId"),
    reason: varchar("reason", { length: 255 }).notNull(),
    description: text("description"),
    status: mysqlEnum("status", ["pending", "reviewing", "resolved", "dismissed"]).default("pending").notNull(),
    action: mysqlEnum("action", ["none", "warning", "suspend", "ban"]).default("none"),
    moderatorId: int("moderatorId"),
    moderationNotes: text("moderationNotes"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    reporterIdx: index("reporter_idx").on(table.reporterId),
    reportedIdx: index("reported_idx").on(table.reportedUserId),
    statusIdx: index("status_idx").on(table.status),
    moderatorIdx: index("moderator_idx").on(table.moderatorId),
  })
);

export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;

/**
 * Content Flags Table
 * Tracks AI-flagged and human-reviewed content
 */
export const contentFlags = mysqlTable(
  "content_flags",
  {
    id: int("id").autoincrement().primaryKey(),
    messageId: int("messageId").notNull(),
    flagReason: varchar("flagReason", { length: 255 }).notNull(),
    aiConfidence: decimal("aiConfidence", { precision: 3, scale: 2 }), // 0.00 - 1.00
    flaggedAt: timestamp("flaggedAt").defaultNow().notNull(),
    isHumanReviewed: boolean("isHumanReviewed").default(false),
    humanVerdict: mysqlEnum("humanVerdict", ["approved", "rejected", "pending"]).default("pending"),
    moderatorId: int("moderatorId"),
    reviewedAt: timestamp("reviewedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    messageIdx: index("message_idx").on(table.messageId),
    moderatorIdx: index("moderator_idx").on(table.moderatorId),
    flagReasonIdx: index("flag_reason_idx").on(table.flagReason),
  })
);

export type ContentFlag = typeof contentFlags.$inferSelect;
export type InsertContentFlag = typeof contentFlags.$inferInsert;

/**
 * Notifications Table
 * Stores user notifications
 */
export const notifications = mysqlTable(
  "notifications",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    type: mysqlEnum("type", ["friend_request", "message", "system", "report_update"]).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content"),
    relatedUserId: int("relatedUserId"),
    relatedItemId: int("relatedItemId"),
    isRead: boolean("isRead").default(false),
    readAt: timestamp("readAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    typeIdx: index("type_idx").on(table.type),
    isReadIdx: index("is_read_idx").on(table.isRead),
  })
);

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Moderation Logs Table
 * Tracks all moderation actions
 */
export const moderationLogs = mysqlTable(
  "moderation_logs",
  {
    id: int("id").autoincrement().primaryKey(),
    moderatorId: int("moderatorId").notNull(),
    action: varchar("action", { length: 64 }).notNull(),
    targetUserId: int("targetUserId"),
    targetReportId: int("targetReportId"),
    reason: text("reason"),
    details: json("details").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    moderatorIdx: index("moderator_idx").on(table.moderatorId),
    targetUserIdx: index("target_user_idx").on(table.targetUserId),
    actionIdx: index("action_idx").on(table.action),
  })
);

export type ModerationLog = typeof moderationLogs.$inferSelect;
export type InsertModerationLog = typeof moderationLogs.$inferInsert;

/**
 * Online Status Table
 * Tracks real-time user presence
 */
export const onlineStatus = mysqlTable(
  "online_status",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().unique(),
    status: mysqlEnum("status", ["online", "away", "offline"]).default("offline").notNull(),
    lastSeen: timestamp("lastSeen").defaultNow().notNull(),
    currentSessionId: int("currentSessionId"),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type OnlineStatus = typeof onlineStatus.$inferSelect;
export type InsertOnlineStatus = typeof onlineStatus.$inferInsert;

/**
 * User Interests Table
 * Stores user interest tags for matching
 */
export const userInterests = mysqlTable(
  "user_interests",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    interest: varchar("interest", { length: 64 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    interestIdx: index("interest_idx").on(table.interest),
    uniqueInterest: unique("unique_interest").on(table.userId, table.interest),
  })
);

export type UserInterest = typeof userInterests.$inferSelect;
export type InsertUserInterest = typeof userInterests.$inferInsert;

/**
 * Analytics Events Table
 * Tracks platform analytics and user behavior
 */
export const analyticsEvents = mysqlTable(
  "analytics_events",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    eventType: varchar("eventType", { length: 64 }).notNull(),
    eventData: json("eventData").$type<Record<string, unknown>>(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    eventTypeIdx: index("event_type_idx").on(table.eventType),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = typeof analyticsEvents.$inferInsert;


/**
 * Groups Table
 * Stores group chat information
 */
export const groups = mysqlTable(
  "groups",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    avatar: varchar("avatar", { length: 512 }),
    createdBy: int("createdBy").notNull(),
    memberCount: int("memberCount").default(1),
    passwordHash: varchar("passwordHash", { length: 255 }),
    isPrivate: boolean("isPrivate").default(false),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    createdByIdx: index("created_by_idx").on(table.createdBy),
    isActiveIdx: index("is_active_idx").on(table.isActive),
  })
);

export type Group = typeof groups.$inferSelect;
export type InsertGroup = typeof groups.$inferInsert;

/**
 * Group Members Table
 * Stores group membership information
 */
export const groupMembers = mysqlTable(
  "group_members",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    userId: int("userId").notNull(),
    role: mysqlEnum("role", ["admin", "co_admin", "moderator", "member"]).default("member").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    lastReadMessageId: int("lastReadMessageId"),
  },
  (table) => ({
    groupIdx: index("group_idx").on(table.groupId),
    userIdx: index("user_idx").on(table.userId),
    uniqueMember: unique("unique_member").on(table.groupId, table.userId),
  })
);

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Group Bans Table
 * Keeps temporary and permanent group-level enforcement separate from global
 * account suspension. A unique row per group/user prevents duplicate active
 * bans and makes rejoin checks inexpensive.
 */
export const groupBans = mysqlTable(
  "group_bans",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    userId: int("userId").notNull(),
    bannedBy: int("bannedBy").notNull(),
    banType: mysqlEnum("banType", ["temporary", "permanent"]).notNull(),
    reason: text("reason"),
    expiresAt: timestamp("expiresAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    groupIdx: index("group_bans_group_idx").on(table.groupId),
    userIdx: index("group_bans_user_idx").on(table.userId),
    expiresAtIdx: index("group_bans_expires_at_idx").on(table.expiresAt),
    uniqueGroupBan: unique("unique_group_ban").on(table.groupId, table.userId),
  })
);

export type GroupBan = typeof groupBans.$inferSelect;
export type InsertGroupBan = typeof groupBans.$inferInsert;

/**
 * Group Messages Table
 * Stores group chat messages
 */
export const groupMessages = mysqlTable(
  "group_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    senderId: int("senderId").notNull(),
    content: text("content").notNull(),
    mentions: json("mentions").$type<number[]>().default([]),
    messageType: mysqlEnum("messageType", ["text", "image", "video", "file", "audio", "system"]).default("text"),
    mediaUrl: varchar("mediaUrl", { length: 512 }),
    isEdited: boolean("isEdited").default(false),
    editedAt: timestamp("editedAt"),
    isDeleted: boolean("isDeleted").default(false),
    deletedAt: timestamp("deletedAt"),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
  },
  (table) => ({
    groupIdx: index("group_idx").on(table.groupId),
    senderIdx: index("sender_idx").on(table.senderId),
    timestampIdx: index("timestamp_idx").on(table.timestamp),
  })
);

export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = typeof groupMessages.$inferInsert;

/**
 * Group Message Reactions Table
 * Stores emoji reactions on group chat messages
 */
export const groupMessageReactions = mysqlTable(
  "group_message_reactions",
  {
    id: int("id").autoincrement().primaryKey(),
    messageId: int("messageId").notNull(),
    groupId: int("groupId").notNull(),
    userId: int("userId").notNull().default(0),
    participantKey: varchar("participantKey", { length: 128 }).notNull(),
    emoji: varchar("emoji", { length: 32 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    messageIdx: index("message_idx").on(table.messageId),
    groupIdx: index("group_idx").on(table.groupId),
    uniqueUserReaction: unique("unique_user_reaction").on(table.messageId, table.participantKey, table.emoji),
  })
);

export type GroupMessageReaction = typeof groupMessageReactions.$inferSelect;
export type InsertGroupMessageReaction = typeof groupMessageReactions.$inferInsert;

/**
 * Group Calls Table
 * Stores group call sessions
 */
export const groupCalls = mysqlTable(
  "group_calls",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    initiatorId: int("initiatorId").notNull(),
    callType: mysqlEnum("callType", ["audio", "video"]).notNull(),
    startedAt: timestamp("startedAt").defaultNow().notNull(),
    endedAt: timestamp("endedAt"),
    duration: int("duration"),
    participantCount: int("participantCount").default(1),
    maxParticipants: int("maxParticipants").default(100),
  },
  (table) => ({
    groupIdx: index("group_idx").on(table.groupId),
    initiatorIdx: index("initiator_idx").on(table.initiatorId),
    startedAtIdx: index("started_at_idx").on(table.startedAt),
  })
);

export type GroupCall = typeof groupCalls.$inferSelect;
export type InsertGroupCall = typeof groupCalls.$inferInsert;

/**
 * Group Call Participants Table
 * Tracks who participated in group calls
 */
export const groupCallParticipants = mysqlTable(
  "group_call_participants",
  {
    id: int("id").autoincrement().primaryKey(),
    groupCallId: int("groupCallId").notNull(),
    userId: int("userId").notNull(),
    joinedAt: timestamp("joinedAt").defaultNow().notNull(),
    leftAt: timestamp("leftAt"),
    duration: int("duration"),
  },
  (table) => ({
    callIdx: index("call_idx").on(table.groupCallId),
    userIdx: index("user_idx").on(table.userId),
  })
);

export type GroupCallParticipant = typeof groupCallParticipants.$inferSelect;
export type InsertGroupCallParticipant = typeof groupCallParticipants.$inferInsert;

/**
 * Group Invites Table
 * Stores pending group invitations
 */
export const groupInvites = mysqlTable(
  "group_invites",
  {
    id: int("id").autoincrement().primaryKey(),
    groupId: int("groupId").notNull(),
    invitedUserId: int("invitedUserId").notNull(),
    invitedBy: int("invitedBy").notNull(),
    status: mysqlEnum("status", ["pending", "accepted", "rejected", "expired"]).default("pending"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    respondedAt: timestamp("respondedAt"),
  },
  (table) => ({
    groupIdx: index("group_idx").on(table.groupId),
    invitedUserIdx: index("invited_user_idx").on(table.invitedUserId),
    statusIdx: index("status_idx").on(table.status),
  })
);

export type GroupInvite = typeof groupInvites.$inferSelect;
export type InsertGroupInvite = typeof groupInvites.$inferInsert;

/**
 * Message Reactions Table
 * Stores emoji reactions on messages
 */
export const messageReactions = mysqlTable(
  "message_reactions",
  {
    id: int("id").autoincrement().primaryKey(),
    messageId: int("messageId").notNull(),
    userId: int("userId").notNull(),
    emoji: varchar("emoji", { length: 10 }).notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    messageIdx: index("message_idx").on(table.messageId),
    userIdx: index("user_idx").on(table.userId),
    emojiIdx: index("emoji_idx").on(table.emoji),
    uniqueReaction: unique("unique_reaction").on(table.messageId, table.userId, table.emoji),
  })
);

export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = typeof messageReactions.$inferInsert;

/**
 * Password Reset Tokens Table
 * Stores temporary tokens for password reset flow
 */
export const passwordResetTokens = mysqlTable(
  "password_reset_tokens",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expiresAt").notNull(),
    usedAt: timestamp("usedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    tokenIdx: index("token_idx").on(table.token),
    expiresAtIdx: index("expires_at_idx").on(table.expiresAt),
  })
);

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Media Uploads Table
 * Tracks uploaded files and media for messages
 */
export const mediaUploads = mysqlTable(
  "media_uploads",
  {
    id: int("id").autoincrement().primaryKey(),
    uploadedBy: int("uploadedBy").notNull(),
    fileName: varchar("fileName", { length: 255 }).notNull(),
    fileType: varchar("fileType", { length: 50 }).notNull(), // image, video, audio, document
    mimeType: varchar("mimeType", { length: 100 }).notNull(),
    fileSize: int("fileSize").notNull(), // bytes
    s3Key: varchar("s3Key", { length: 512 }).notNull(),
    s3Url: varchar("s3Url", { length: 512 }).notNull(),
    messageId: int("messageId"), // Link to message if attached to message
    groupMessageId: int("groupMessageId"), // Link to group message if attached
    thumbnail: varchar("thumbnail", { length: 512 }), // Thumbnail URL for images/videos
    duration: int("duration"), // Duration in seconds for audio/video
    width: int("width"), // Width for images/videos
    height: int("height"), // Height for images/videos
    isDeleted: boolean("isDeleted").default(false),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    uploadedByIdx: index("uploaded_by_idx").on(table.uploadedBy),
    messageIdx: index("message_idx").on(table.messageId),
    groupMessageIdx: index("group_message_idx").on(table.groupMessageId),
    s3KeyIdx: index("s3_key_idx").on(table.s3Key),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export type MediaUpload = typeof mediaUploads.$inferSelect;
export type InsertMediaUpload = typeof mediaUploads.$inferInsert;
