/**
 * Socket.IO real-time engine.
 *
 * Registered users authenticate with the normal signed cookie. Anonymous
 * visitors explicitly select anonymous mode; that path does not inspect a
 * cookie, create a database record, or mint a token. Their identity and chats
 * live only in this process for the lifetime of the socket connection.
 */

import { Server as HTTPServer } from "http";
import { nanoid } from "nanoid";
import { Server as SocketIOServer } from "socket.io";
import type { User } from "../drizzle/schema";
import * as db from "./db";
import { containsProfanity, isSpam, moderateMessage } from "./moderation";
import { consumeRate } from "./security";
import { parseSessionCookie } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import * as groupDb from "./groups";

type SessionType = "text" | "voice" | "video";
type ParticipantId = number | string;

interface MatchingUser {
  participantId: ParticipantId;
  databaseUserId: number | null;
  socketId: string;
  sessionType: SessionType;
  preferences: unknown;
  joinedAt: number;
  isAnonymous: boolean;
  displayName: string;
}

interface ActiveSession {
  sessionId: ParticipantId;
  persistedSessionId: number | null;
  user1: MatchingUser;
  user2: MatchingUser;
  startedAt: number;
  sessionType: SessionType;
}

type SocketIdentity = {
  participantId: ParticipantId;
  databaseUserId: number | null;
  user: User | null;
  isAnonymous: boolean;
  displayName: string;
};

type SocketIdentityDependencies = {
  consume: typeof consumeRate;
  verifySession: (
    token: string | undefined
  ) => Promise<{ openId: string } | null>;
  getUserByOpenId: typeof db.getUserByOpenId;
};

const defaultSocketIdentityDependencies: SocketIdentityDependencies = {
  consume: consumeRate,
  verifySession: token => sdk.verifySession(token),
  getUserByOpenId: db.getUserByOpenId,
};

function participantKey(participantId: ParticipantId) {
  return String(participantId);
}

function groupCallParticipantKey(callId: number, userId: number) {
  return `${callId}:${userId}`;
}

export function areMatchTypesCompatible(
  first: Pick<MatchingUser, "sessionType">,
  second: Pick<MatchingUser, "sessionType">
) {
  return first.sessionType === second.sessionType;
}

export function getMatchingQueueCounts(
  queue: Array<Pick<MatchingUser, "sessionType">>
) {
  const counts: Record<SessionType, number> = {
    text: 0,
    voice: 0,
    video: 0,
  };
  for (const participant of queue) counts[participant.sessionType] += 1;
  return {
    context: "random_matching_queue" as const,
    matchingState: "SEARCHING" as const,
    counts,
    total: counts.text + counts.voice + counts.video,
  };
}

function generateAnonymousName() {
  const adjectives = ["Bright", "Calm", "Kind", "Quiet", "Swift", "Warm"];
  const animals = ["Bear", "Fox", "Hawk", "Otter", "Panda", "Tiger"];
  const adjective =
    adjectives[Math.floor(Math.random() * adjectives.length)] ?? "Kind";
  const animal = animals[Math.floor(Math.random() * animals.length)] ?? "Panda";
  return `${adjective}${animal}${Math.floor(100 + Math.random() * 900)}`;
}

/**
 * Resolve a socket identity. Anonymous mode intentionally returns before any
 * cookie parsing, token verification, or database user lookup.
 */
export async function resolveSocketIdentity(
  input: {
    mode: unknown;
    ip: string;
    cookieHeader?: string;
  },
  dependencies: SocketIdentityDependencies = defaultSocketIdentityDependencies
): Promise<SocketIdentity> {
  if (input.mode === "anonymous") {
    const rate = await dependencies.consume(
      `socket.anonymous-connect:${input.ip}`,
      20,
      60_000
    );
    if (!rate.allowed) {
      throw new Error("Too many anonymous connections");
    }

    return {
      participantId: `anon_${nanoid(16)}`,
      databaseUserId: null,
      user: null,
      isAnonymous: true,
      displayName: generateAnonymousName(),
    };
  }

  const sessionToken = parseSessionCookie(input.cookieHeader);
  const session = await dependencies.verifySession(sessionToken);
  if (!session) throw new Error("Unauthenticated");

  const user = await dependencies.getUserByOpenId(session.openId);
  if (!user) throw new Error("User not found");
  if (user.isBanned || user.isSuspended) {
    throw new Error("Account suspended or banned");
  }

  return {
    participantId: user.id,
    databaseUserId: user.id,
    user,
    isAnonymous: false,
    displayName: user.username ?? user.name ?? `User${user.id}`,
  };
}

function getInsertId(result: unknown) {
  const candidate =
    (result as { insertId?: unknown } | undefined)?.insertId ??
    (result as Array<{ insertId?: unknown }> | undefined)?.[0]?.insertId;
  const insertId = Number(candidate);
  return Number.isInteger(insertId) && insertId > 0 ? insertId : null;
}

class SocketManager {
  private io: SocketIOServer;
  private waitingQueue: MatchingUser[] = [];
  private activeSessions = new Map<string, ActiveSession>();
  private participantSockets = new Map<string, string>();
  private pendingGroupCallLeaves = new Map<
    string,
    ReturnType<typeof setTimeout>
  >();

  constructor(httpServer: HTTPServer) {
    const allowedOrigins = (
      process.env.ALLOWED_ORIGINS ??
      process.env.FRONTEND_URL ??
      ""
    )
      .split(",")
      .map(value => value.trim())
      .filter(Boolean);

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : false,
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
      // Group media is validated again before persistence. This ceiling allows
      // the existing 15 MB attachment feature plus base64 transport overhead.
      maxHttpBufferSize: 22_000_000,
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const identity = await resolveSocketIdentity({
          mode: socket.handshake.auth?.mode,
          ip: socket.handshake.address || "unknown",
          cookieHeader: socket.handshake.headers?.cookie,
        });
        socket.data.participantId = identity.participantId;
        socket.data.databaseUserId = identity.databaseUserId;
        socket.data.userId = identity.databaseUserId;
        socket.data.user = identity.user;
        socket.data.isAnonymous = identity.isAnonymous;
        socket.data.displayName = identity.displayName;
        return next();
      } catch (error) {
        console.error("[Socket] Connection setup failed", error);
        return next(new Error("Connection failed"));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on("connection", socket => {
      const participantId = socket.data.participantId as ParticipantId;
      const databaseUserId = socket.data.databaseUserId as number | null;
      const isAnonymous = Boolean(socket.data.isAnonymous);
      const displayName = String(socket.data.displayName);
      const key = participantKey(participantId);
      const joinedGroupCallIds = new Set<number>();
      const joinedGroupIds = new Set<number>();
      const completedGroupMessageRequests = new Map<
        string,
        { groupId: number; messageId: number }
      >();

      this.participantSockets.set(key, socket.id);
      console.log(
        `[Socket] ${isAnonymous ? "Anonymous visitor" : `User ${databaseUserId}`} connected`
      );

      if (databaseUserId) {
        void db.updateOnlineStatus(databaseUserId, "online");
      }

      socket.emit("identity:ready", {
        participantId,
        displayName,
        isAnonymous,
      });
      this.broadcastOnlineCount();
      socket.emit(
        "stats:matching-queue",
        getMatchingQueueCounts(this.waitingQueue)
      );

      const removeFromQueue = () => {
        const previousLength = this.waitingQueue.length;
        this.waitingQueue = this.waitingQueue.filter(
          queued => participantKey(queued.participantId) !== key
        );
        if (this.waitingQueue.length !== previousLength) {
          this.broadcastMatchingQueueCount();
        }
      };

      const enqueueForChat = async (requestedType: unknown) => {
        removeFromQueue();

        const allowedTypes: SessionType[] = ["text", "voice", "video"];
        const requested = allowedTypes.includes(requestedType as SessionType)
          ? (requestedType as SessionType)
          : "text";
        const sessionType = isAnonymous ? "text" : requested;

        const preferences = databaseUserId
          ? await db.getMatchingPreferences(databaseUserId)
          : null;
        const matchingUser: MatchingUser = {
          participantId,
          databaseUserId,
          socketId: socket.id,
          sessionType,
          preferences,
          joinedAt: Date.now(),
          isAnonymous,
          displayName,
        };

        this.waitingQueue.push(matchingUser);
        this.broadcastMatchingQueueCount();
        const match = this.findMatch(matchingUser);
        if (match) {
          try {
            await this.createChatSession(matchingUser, match, sessionType);
          } catch (error) {
            console.error("[Socket] Failed to create chat session", error);
            removeFromQueue();
            socket.emit("chat:error", {
              message: "Unable to start a chat right now. Please try again.",
            });
          }
          return;
        }

        socket.emit("chat:waiting", {
          position: this.waitingQueue.length,
          message: "Searching for a match...",
        });
      };

      socket.on("user:online", async () => {
        if (databaseUserId) {
          await db.updateOnlineStatus(databaseUserId, "online");
        }
        this.broadcastOnlineCount();
      });

      socket.on("user:away", async () => {
        if (databaseUserId) {
          await db.updateOnlineStatus(databaseUserId, "away");
        }
        this.broadcastOnlineCount();
      });

      socket.on("chat:join-queue", async data => {
        await enqueueForChat(data?.sessionType);
      });

      socket.on("chat:skip", async data => {
        await this.closeActiveSession(participantId, "chat:partner-left");
        await enqueueForChat(data?.sessionType);
      });

      socket.on("chat:leave-queue", () => {
        removeFromQueue();
        socket.emit("chat:left-queue");
      });

      socket.on("chat:end", async data => {
        await this.closeActiveSession(
          participantId,
          "chat:partner-left",
          data?.sessionId
        );
        socket.emit("chat:ended");
      });

      socket.on("message:send", async data => {
        const content =
          typeof data?.content === "string" ? data.content.trim() : "";
        const session = this.getOwnedSession(data?.sessionId, participantId);
        if (!content || !session) return;
        if (content.length > 2_000) {
          socket.emit("chat:error", {
            message: "Messages must be 2,000 characters or fewer.",
          });
          return;
        }

        const ip = socket.handshake.address || "unknown";
        const rate = await consumeRate(
          `socket.message:${ip}:${key}`,
          60,
          60_000
        );
        if (!rate.allowed) {
          socket.emit("chat:error", {
            message: "You are sending messages too quickly. Please slow down.",
          });
          return;
        }

        const other = this.getOtherParticipant(session, participantId);
        if (!other) return;

        let shouldFlag = containsProfanity(content) || isSpam(content);
        let flagReason = containsProfanity(content)
          ? "Inappropriate language"
          : isSpam(content)
            ? "Spam detected"
            : undefined;

        if (
          !shouldFlag &&
          session.persistedSessionId &&
          databaseUserId &&
          other.databaseUserId
        ) {
          const result = await db.createMessage(
            session.persistedSessionId,
            databaseUserId,
            other.databaseUserId,
            content
          );
          const moderation = await moderateMessage(
            getInsertId(result) ?? 0,
            content,
            databaseUserId
          );
          shouldFlag = moderation.shouldFlag;
          flagReason = moderation.reason;
        }

        if (shouldFlag) {
          socket.emit("message:flagged", {
            reason: flagReason ?? "Message blocked by moderation",
          });
          return;
        }

        this.io.to(other.socketId).emit("message:received", {
          sessionId: session.sessionId,
          senderId: participantId,
          content,
          timestamp: new Date(),
        });
        socket.emit("message:sent", {
          sessionId: session.sessionId,
          content,
          timestamp: new Date(),
        });
      });

      socket.on("message:typing", data => {
        const session = this.getOwnedSession(data?.sessionId, participantId);
        const other = session
          ? this.getOtherParticipant(session, participantId)
          : null;
        if (other) {
          this.io.to(other.socketId).emit("message:user-typing");
        }
      });

      socket.on("message:stop-typing", data => {
        const session = this.getOwnedSession(data?.sessionId, participantId);
        const other = session
          ? this.getOtherParticipant(session, participantId)
          : null;
        if (other) {
          this.io.to(other.socketId).emit("message:user-stop-typing");
        }
      });

      socket.on("private-message:send", async data => {
        if (!databaseUserId) {
          socket.emit("chat:error", {
            message: "Private messages require an account.",
          });
          return;
        }

        const receiverId = Number(data?.receiverId);
        const content =
          typeof data?.content === "string" ? data.content.trim() : "";
        if (
          !Number.isInteger(receiverId) ||
          !content ||
          content.length > 2_000
        ) {
          return;
        }

        try {
          if (!(await db.canUsersMessage(databaseUserId, receiverId))) {
            socket.emit("chat:error", {
              message:
                "Messages are available between friends who have not blocked each other.",
            });
            return;
          }

          if (containsProfanity(content) || isSpam(content)) {
            socket.emit("private-message:flagged", {
              reason: "This message was blocked by moderation.",
            });
            return;
          }

          const result = await db.createPrivateMessage(
            databaseUserId,
            receiverId,
            content
          );
          const messageId = getInsertId(result);
          if (!messageId) throw new Error("Message id was not returned");

          const moderation = await moderateMessage(
            messageId,
            content,
            databaseUserId
          );
          if (moderation.shouldFlag) {
            socket.emit("private-message:flagged", {
              reason: moderation.reason,
            });
            return;
          }

          const timestamp = new Date();
          const receiverSocketId = this.participantSockets.get(
            participantKey(receiverId)
          );
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit("private-message:received", {
              id: messageId,
              senderId: databaseUserId,
              content,
              timestamp,
            });
          }

          socket.emit("private-message:sent", {
            id: messageId,
            receiverId,
            content,
            timestamp,
          });

          const sender = await db.getUserById(databaseUserId);
          if (sender) {
            await db.createNotification(
              receiverId,
              "message",
              `New message from ${sender.name ?? sender.username ?? "Someone"}`,
              content,
              databaseUserId
            );
          }
        } catch (error) {
          console.error("[Socket] Private message failed", error);
          socket.emit("chat:error", {
            message: "The message could not be sent. Please try again.",
          });
        }
      });

      const relayWebRtcEvent = (eventName: string, data: any) => {
        const session = this.getOwnedSession(data?.sessionId, participantId);
        const other = session
          ? this.getOtherParticipant(session, participantId)
          : null;
        if (!session || !other) return;

        const payload = { ...data };
        delete payload.receiverId;
        this.io.to(other.socketId).emit(eventName, {
          ...payload,
          senderId: participantId,
          sessionId: session.sessionId,
        });
      };

      socket.on("webrtc:offer", data => relayWebRtcEvent("webrtc:offer", data));
      socket.on("webrtc:answer", data =>
        relayWebRtcEvent("webrtc:answer", data)
      );
      socket.on("webrtc:ice-candidate", data =>
        relayWebRtcEvent("webrtc:ice-candidate", data)
      );
      socket.on("webrtc:connection-state", data =>
        relayWebRtcEvent("webrtc:connection-state", data)
      );

      socket.on("call:end", async data => {
        await this.closeActiveSession(
          participantId,
          "call:ended",
          data?.sessionId,
          Number(data?.duration) || 0
        );
        socket.emit("call:ended", { sessionId: data?.sessionId });
      });

      socket.on("notification:subscribe", () => {
        if (databaseUserId) {
          socket.join(`user:${databaseUserId}:notifications`);
        }
      });

      const emitGroupError = (message: string) => {
        socket.emit("group:error", { message });
      };
      const lastGroupTypingAt = new Map<number, number>();

      socket.on("group:join", async data => {
        const groupId = Number(data?.groupId);
        if (!Number.isInteger(groupId) || groupId < 1) {
          emitGroupError("Unable to join this group");
          return;
        }
        try {
          const rateKey = databaseUserId
            ? `socket.group-join:${databaseUserId}`
            : `socket.group-join:${participantId}`;
          const rate = await consumeRate(rateKey, 60, 60_000);
          if (!rate.allowed) {
            emitGroupError("Too many group connection attempts");
            return;
          }
          const canJoin = databaseUserId
            ? await groupDb.ensurePublicGroupMembership(groupId, databaseUserId)
            : await groupDb.canAccessGroup(groupId, 0);
          if (!canJoin) {
            emitGroupError(
              "This group is private, unavailable, or you are banned"
            );
            return;
          }
          await socket.join(`group:${groupId}`);
          joinedGroupIds.add(groupId);
          socket.emit("group:joined", { groupId });
          await this.broadcastGroupPresence(groupId);
        } catch (error) {
          console.error("[Socket] Group join failed", error);
          emitGroupError("Unable to join this group right now");
        }
      });

      socket.on("group:leave", async data => {
        const groupId = Number(data?.groupId);
        if (Number.isInteger(groupId) && groupId > 0) {
          joinedGroupIds.delete(groupId);
          await socket.leave(`group:${groupId}`);
          await this.broadcastGroupPresence(groupId);
        }
      });

      socket.on("group:send-message", async (data, acknowledge) => {
        const respond = (
          response:
            { ok: true; messageId: number } | { ok: false; message: string }
        ) => {
          if (typeof acknowledge === "function") acknowledge(response);
        };
        const fail = (message: string) => {
          if (typeof acknowledge !== "function") emitGroupError(message);
          respond({ ok: false, message });
        };
        const groupId = Number(data?.groupId);
        const content =
          typeof data?.content === "string" ? data.content.trim() : "";
        const requestedMentions: number[] = Array.isArray(data?.mentions)
          ? [
              ...new Set<number>(
                data.mentions
                  .map((value: unknown) => Number(value))
                  .filter((id: number) => Number.isInteger(id) && id > 0)
              ),
            ].slice(0, 20)
          : [];

        const messageType =
          data?.messageType === "audio" ||
          data?.messageType === "image" ||
          data?.messageType === "video" ||
          data?.messageType === "file"
            ? data.messageType
            : "text";
        const mediaUrl =
          typeof data?.mediaUrl === "string" ? data.mediaUrl.trim() : undefined;
        const clientRequestId =
          typeof data?.clientRequestId === "string" &&
          /^[A-Za-z0-9_-]{8,80}$/.test(data.clientRequestId)
            ? data.clientRequestId
            : undefined;

        if (clientRequestId) {
          const completedRequest =
            completedGroupMessageRequests.get(clientRequestId);
          if (completedRequest?.groupId === groupId) {
            respond({ ok: true, messageId: completedRequest.messageId });
            return;
          }
        }

        const maximumMediaLength =
          messageType === "audio" ? 5_600_000 : 21_000_000;

        if (
          !Number.isInteger(groupId) ||
          groupId < 1 ||
          !content ||
          content.length > 500_000 ||
          (mediaUrl?.length ?? 0) > maximumMediaLength
        ) {
          const message = "Messages must contain valid content";
          fail(message);
          return;
        }
        if (!socket.rooms.has(`group:${groupId}`)) {
          const message = "Join the group before sending a message";
          fail(message);
          return;
        }

        try {
          const rateKey = databaseUserId
            ? `socket.group-message:${databaseUserId}`
            : `socket.group-message:${participantId}`;
          const rate = await consumeRate(rateKey, 40, 60_000);
          if (!rate.allowed) {
            const message = "You are sending messages too quickly";
            fail(message);
            return;
          }
          if (
            messageType === "text" &&
            (containsProfanity(content) || isSpam(content))
          ) {
            const message = "This message was blocked by moderation";
            fail(message);
            return;
          }

          const guestSenderName = `${displayName} (Guest)`;
          const senderId = databaseUserId ?? 0;
          const result = await groupDb.createGroupMessage(
            groupId,
            senderId,
            content,
            requestedMentions,
            guestSenderName,
            messageType,
            mediaUrl
          );
          if (!result) {
            const message = "The group message could not be sent";
            fail(message);
            return;
          }

          this.io.to(`group:${groupId}`).emit("group:message", result.message);
          if (clientRequestId) {
            completedGroupMessageRequests.set(clientRequestId, {
              groupId,
              messageId: result.message.id,
            });
            if (completedGroupMessageRequests.size > 200) {
              const oldestRequestId = completedGroupMessageRequests
                .keys()
                .next().value;
              if (oldestRequestId)
                completedGroupMessageRequests.delete(oldestRequestId);
            }
          }
          respond({ ok: true, messageId: result.message.id });
          for (const mentionedUserId of result.mentionedUserIds) {
            this.io
              .to(`user:${mentionedUserId}:notifications`)
              .emit("group:mention", {
                groupId,
                groupName: result.groupName,
                messageId: result.message.id,
                senderId,
                senderName: result.message.senderDisplayName,
                senderHandle: result.message.senderHandle,
              });
          }
        } catch (error) {
          console.error("[Socket] Group message send failed", error);
          const message = "Failed to send group message";
          fail(message);
        }
      });

      socket.on("group:toggle-reaction", async (data, acknowledge) => {
        const messageId = Number(data?.messageId);
        const groupId = Number(data?.groupId);
        const emoji = typeof data?.emoji === "string" ? data.emoji.trim() : "";
        if (
          !Number.isInteger(messageId) ||
          messageId < 1 ||
          !Number.isInteger(groupId) ||
          groupId < 1 ||
          !emoji ||
          !socket.rooms.has(`group:${groupId}`)
        ) {
          if (typeof acknowledge === "function")
            acknowledge({ ok: false, reason: "Validation failed" });
          return;
        }
        try {
          const userId = databaseUserId ?? 0;
          const result = await groupDb.toggleMessageReaction(
            messageId,
            groupId,
            userId,
            String(participantId),
            emoji
          );
          this.io.to(`group:${groupId}`).emit("group:reaction-updated", result);
          if (typeof acknowledge === "function") acknowledge({ ok: true });
        } catch (error) {
          console.error("[Socket] Toggle message reaction failed", error);
        }
      });

      socket.on("group:typing", data => {
        const groupId = Number(data?.groupId);
        if (
          !Number.isInteger(groupId) ||
          groupId < 1 ||
          !socket.rooms.has(`group:${groupId}`)
        ) {
          return;
        }
        const now = Date.now();
        const previousTypingAt = lastGroupTypingAt.get(groupId) ?? 0;
        if (now - previousTypingAt < 250) return;
        lastGroupTypingAt.set(groupId, now);
        socket.to(`group:${groupId}`).emit("group:typing", {
          groupId,
          userId: databaseUserId ?? 0,
          displayName: databaseUserId ? displayName : `${displayName} (Guest)`,
          isTyping: Boolean(data?.isTyping),
        });
      });

      socket.on("group:delete-message", async data => {
        const messageId = Number(data?.messageId);
        if (!databaseUserId || !Number.isInteger(messageId) || messageId < 1) {
          return;
        }
        try {
          const result = await groupDb.deleteGroupMessage(
            messageId,
            databaseUserId
          );
          if (!result) {
            emitGroupError("You cannot delete this message");
            return;
          }
          this.io
            .to(`group:${result.groupId}`)
            .emit("group:message-deleted", result);
        } catch (error) {
          console.error("[Socket] Group message deletion failed", error);
          emitGroupError("The message could not be deleted");
        }
      });

      socket.on("group-call:start", async (data, acknowledge) => {
        const respond = (response: Record<string, unknown>) => {
          if (typeof acknowledge === "function") acknowledge(response);
        };
        const groupId = Number(data?.groupId);
        const callType =
          data?.callType === "audio" || data?.callType === "video"
            ? (data.callType as any)
            : null;
        if (
          !Number.isInteger(groupId) ||
          groupId < 1 ||
          !callType ||
          !socket.rooms.has(`group:${groupId}`)
        ) {
          respond({
            ok: false,
            message: "Join the group before starting a call",
          });
          return;
        }
        try {
          const callerId = databaseUserId ?? 0;
          const rateKey = databaseUserId
            ? `socket.group-call-start:${databaseUserId}`
            : `socket.group-call-start:${participantId}`;
          const rate = await consumeRate(rateKey, 10, 60 * 60_000);
          if (!rate.allowed) {
            respond({ ok: false, message: "Too many group calls started" });
            return;
          }
          const result = await groupDb.startGroupCall(
            groupId,
            callerId,
            callType
          );
          if (!result) {
            respond({
              ok: false,
              message:
                "Only the Group Admin, Co-Admins, and Moderators can start calls",
            });
            return;
          }
          if (result.created) {
            this.io
              .to(`group:${groupId}`)
              .emit("group-call:started", result.call);
            for (const invitedUserId of result.invitedUserIds) {
              this.io
                .to(`user:${invitedUserId}:notifications`)
                .emit("group-call:invitation", result.call);
            }
          }
          respond({ ok: true, call: result.call });
        } catch (error) {
          console.error("[Socket] Group call start failed", error);
          respond({
            ok: false,
            message: "The group call could not be started",
          });
        }
      });

      socket.on("group-call:join", async (data, acknowledge) => {
        const respond = (response: Record<string, unknown>) => {
          if (typeof acknowledge === "function") acknowledge(response);
        };
        const callId = Number(data?.callId);
        if (!Number.isInteger(callId) || callId < 1) {
          respond({ ok: false, message: "Invalid group call" });
          return;
        }
        try {
          const callerId = databaseUserId ?? 0;
          const rateKey = databaseUserId
            ? `socket.group-call-join:${databaseUserId}`
            : `socket.group-call-join:${participantId}`;
          const rate = await consumeRate(rateKey, 30, 60_000);
          if (!rate.allowed) {
            respond({ ok: false, message: "Too many call join attempts" });
            return;
          }
          const leaveKey = groupCallParticipantKey(callId, callerId);
          const pendingLeave = this.pendingGroupCallLeaves.get(leaveKey);
          if (pendingLeave) clearTimeout(pendingLeave);
          this.pendingGroupCallLeaves.delete(leaveKey);

          const result = await groupDb.joinGroupCall(callId, callerId);
          if (!result) {
            respond({
              ok: false,
              message: "This group call is no longer active",
            });
            return;
          }
          if (result.status === "full") {
            respond({ ok: false, message: "This group call is full" });
            return;
          }

          const callRoom = `group-call:${callId}`;
          const userRoom = `${callRoom}:user:${callerId}`;
          const firstJoinFromSocket = !joinedGroupCallIds.has(callId);
          joinedGroupCallIds.add(callId);
          await socket.join([callRoom, userRoom]);
          const currentParticipant = result.participants.find(
            participant => participant.userId === callerId
          );
          if (firstJoinFromSocket) {
            socket.to(callRoom).emit("group-call:user-joined", {
              callId,
              participant: currentParticipant ?? {
                userId: callerId,
                username: null,
                name: displayName,
                avatar: null,
                handle: callerId > 0 ? `user${callerId}` : "guest",
                displayName: databaseUserId
                  ? displayName
                  : `${displayName} (Guest)`,
              },
            });
          }
          respond({
            ok: true,
            call: result.call,
            participants: result.participants,
          });
        } catch (error) {
          console.error("[Socket] Group call join failed", error);
          respond({ ok: false, message: "Unable to join the group call" });
        }
      });

      const relayGroupCallDescription = async (
        eventName: "group-call:offer" | "group-call:answer",
        field: "offer" | "answer",
        data: any
      ) => {
        const callId = Number(data?.callId);
        const targetUserId = Number(data?.targetUserId);
        const description = data?.[field];
        const callerId = databaseUserId ?? 0;
        if (
          !Number.isInteger(callId) ||
          !Number.isInteger(targetUserId) ||
          targetUserId < 0 ||
          !description ||
          typeof description.type !== "string" ||
          typeof description.sdp !== "string" ||
          description.sdp.length > 50_000 ||
          !joinedGroupCallIds.has(callId)
        ) {
          return;
        }
        try {
          if (
            !(await groupDb.canSignalGroupCall(callId, callerId, targetUserId))
          ) {
            return;
          }
          this.io
            .to(`group-call:${callId}:user:${targetUserId}`)
            .emit(eventName, {
              callId,
              fromUserId: callerId,
              [field]: description,
            });
        } catch (error) {
          console.error(`[Socket] ${eventName} relay failed`, error);
        }
      };

      socket.on("group-call:offer", data => {
        void relayGroupCallDescription("group-call:offer", "offer", data);
      });
      socket.on("group-call:answer", data => {
        void relayGroupCallDescription("group-call:answer", "answer", data);
      });
      socket.on("group-call:ice-candidate", async data => {
        const callId = Number(data?.callId);
        const targetUserId = Number(data?.targetUserId);
        const candidate = data?.candidate;
        const callerId = databaseUserId ?? 0;
        if (
          !Number.isInteger(callId) ||
          !Number.isInteger(targetUserId) ||
          targetUserId < 0 ||
          !candidate ||
          typeof candidate.candidate !== "string" ||
          candidate.candidate.length > 10_000 ||
          !joinedGroupCallIds.has(callId)
        ) {
          return;
        }
        try {
          if (
            !(await groupDb.canSignalGroupCall(callId, callerId, targetUserId))
          ) {
            return;
          }
          this.io
            .to(`group-call:${callId}:user:${targetUserId}`)
            .emit("group-call:ice-candidate", {
              callId,
              fromUserId: callerId,
              candidate,
            });
        } catch (error) {
          console.error("[Socket] Group call ICE relay failed", error);
        }
      });

      const leaveGroupCallNow = async (callId: number) => {
        const callerId = databaseUserId ?? 0;
        if (!joinedGroupCallIds.has(callId)) return null;
        joinedGroupCallIds.delete(callId);
        await socket.leave(`group-call:${callId}`);
        await socket.leave(`group-call:${callId}:user:${callerId}`);
        const result = await groupDb.leaveGroupCall(callId, callerId);
        if (!result) return null;
        this.io.to(`group-call:${callId}`).emit("group-call:user-left", {
          callId,
          userId: callerId,
        });
        if (result.ended) {
          this.io.to(`group:${result.groupId}`).emit("group-call:ended", {
            callId,
            groupId: result.groupId,
          });
        }
        return result;
      };

      socket.on("group-call:leave", async (data, acknowledge) => {
        const callId = Number(data?.callId);
        if (!Number.isInteger(callId) || callId < 1) return;
        try {
          const result = await leaveGroupCallNow(callId);
          if (typeof acknowledge === "function") {
            acknowledge({ ok: Boolean(result) });
          }
        } catch (error) {
          console.error("[Socket] Group call leave failed", error);
        }
      });

      socket.on("group-call:end", async (data, acknowledge) => {
        const callId = Number(data?.callId);
        const callerId = databaseUserId ?? 0;
        if (!Number.isInteger(callId) || callId < 1) {
          return;
        }
        try {
          const result = await groupDb.endGroupCall(callId, callerId);
          if (!result) {
            if (typeof acknowledge === "function") {
              acknowledge({ ok: false, message: "You cannot end this call" });
            }
            return;
          }
          const payload = { callId, groupId: result.groupId };
          this.io.to(`group-call:${callId}`).emit("group-call:ended", payload);
          this.io
            .to(`group:${result.groupId}`)
            .emit("group-call:ended", payload);
          if (typeof acknowledge === "function") acknowledge({ ok: true });
        } catch (error) {
          console.error("[Socket] Group call end failed", error);
          if (typeof acknowledge === "function") {
            acknowledge({ ok: false, message: "Unable to end the call" });
          }
        }
      });

      socket.on("disconnect", async () => {
        removeFromQueue();
        await this.closeActiveSession(participantId, "chat:partner-left");
        const callerId = databaseUserId ?? 0;
        for (const callId of joinedGroupCallIds) {
          const leaveKey = groupCallParticipantKey(callId, callerId);
          const existingTimer = this.pendingGroupCallLeaves.get(leaveKey);
          if (existingTimer) clearTimeout(existingTimer);
          const timer = setTimeout(async () => {
            this.pendingGroupCallLeaves.delete(leaveKey);
            const userRoom = `group-call:${callId}:user:${callerId}`;
            if ((this.io.sockets.adapter.rooms.get(userRoom)?.size ?? 0) > 0) {
              return;
            }
            try {
              const result = await groupDb.leaveGroupCall(callId, callerId);
              if (!result) return;
              this.io.to(`group-call:${callId}`).emit("group-call:user-left", {
                callId,
                userId: callerId,
              });
              if (result.ended) {
                this.io.to(`group:${result.groupId}`).emit("group-call:ended", {
                  callId,
                  groupId: result.groupId,
                });
              }
            } catch (error) {
              console.error(
                "[Socket] Group call disconnect cleanup failed",
                error
              );
            }
          }, 10_000);
          this.pendingGroupCallLeaves.set(leaveKey, timer);
        }
        if (databaseUserId) {
          await db.updateOnlineStatus(databaseUserId, "offline");
        }
        if (this.participantSockets.get(key) === socket.id) {
          this.participantSockets.delete(key);
        }
        this.broadcastOnlineCount();
        for (const groupId of joinedGroupIds) {
          void this.broadcastGroupPresence(groupId);
        }
        console.log(
          `[Socket] ${isAnonymous ? "Anonymous visitor" : `User ${databaseUserId}`} disconnected`
        );
      });
    });
  }

  private findMatch(user: MatchingUser) {
    return (
      this.waitingQueue.find(
        candidate =>
          participantKey(candidate.participantId) !==
            participantKey(user.participantId) &&
          areMatchTypesCompatible(user, candidate) &&
          this.preferencesMatch(user, candidate)
      ) ?? null
    );
  }

  private preferencesMatch(_user1: MatchingUser, _user2: MatchingUser) {
    return true;
  }

  private async createChatSession(
    user1: MatchingUser,
    user2: MatchingUser,
    requestedType: SessionType
  ) {
    const sessionType =
      user1.isAnonymous || user2.isAnonymous ? "text" : requestedType;
    let persistedSessionId: number | null = null;

    if (user1.databaseUserId && user2.databaseUserId) {
      const result = await db.createChatSession(
        user1.databaseUserId,
        user2.databaseUserId,
        sessionType
      );
      persistedSessionId = getInsertId(result);
      if (!persistedSessionId) {
        throw new Error("Database did not return a chat session id");
      }
    }

    const sessionId: ParticipantId =
      persistedSessionId ?? `anonymous_${nanoid(18)}`;
    const activeSession: ActiveSession = {
      sessionId,
      persistedSessionId,
      user1,
      user2,
      startedAt: Date.now(),
      sessionType,
    };

    this.waitingQueue = this.waitingQueue.filter(
      queued =>
        participantKey(queued.participantId) !==
          participantKey(user1.participantId) &&
        participantKey(queued.participantId) !==
          participantKey(user2.participantId)
    );
    this.broadcastMatchingQueueCount();
    this.activeSessions.set(participantKey(sessionId), activeSession);

    this.io.to(user1.socketId).emit("chat:matched", {
      sessionId,
      matchedUserId: user2.participantId,
      matchedDisplayName: user2.displayName,
      sessionType,
      ephemeral: !persistedSessionId,
      initiator: true,
    });
    this.io.to(user2.socketId).emit("chat:matched", {
      sessionId,
      matchedUserId: user1.participantId,
      matchedDisplayName: user1.displayName,
      sessionType,
      ephemeral: !persistedSessionId,
      initiator: false,
    });
  }

  private getOwnedSession(sessionId: unknown, participantId: ParticipantId) {
    if (typeof sessionId !== "string" && typeof sessionId !== "number") {
      return null;
    }
    const session = this.activeSessions.get(participantKey(sessionId));
    if (!session) return null;
    const key = participantKey(participantId);
    const ownsSession =
      participantKey(session.user1.participantId) === key ||
      participantKey(session.user2.participantId) === key;
    return ownsSession ? session : null;
  }

  private getOtherParticipant(
    session: ActiveSession,
    participantId: ParticipantId
  ) {
    const key = participantKey(participantId);
    if (participantKey(session.user1.participantId) === key) {
      return session.user2;
    }
    if (participantKey(session.user2.participantId) === key) {
      return session.user1;
    }
    return null;
  }

  private async closeActiveSession(
    participantId: ParticipantId,
    partnerEvent: string,
    requestedSessionId?: unknown,
    duration = 0
  ) {
    const session =
      requestedSessionId !== undefined
        ? this.getOwnedSession(requestedSessionId, participantId)
        : [...this.activeSessions.values()].find(active =>
            [active.user1, active.user2].some(
              user =>
                participantKey(user.participantId) ===
                participantKey(participantId)
            )
          );
    if (!session) return;

    const other = this.getOtherParticipant(session, participantId);
    this.activeSessions.delete(participantKey(session.sessionId));
    if (session.persistedSessionId) {
      await db.endChatSession(session.persistedSessionId, duration);
    }
    if (other) {
      this.io.to(other.socketId).emit(partnerEvent, {
        sessionId: session.sessionId,
      });
    }
  }

  private broadcastMatchingQueueCount() {
    this.io.emit(
      "stats:matching-queue",
      getMatchingQueueCounts(this.waitingQueue)
    );
  }

  private async broadcastGroupPresence(groupId: number) {
    const room = `group:${groupId}`;
    const sockets = await this.io.in(room).fetchSockets();
    const participants = new Map<
      string,
      {
        participantId: string;
        userId: number | null;
        displayName: string;
        isAnonymous: boolean;
      }
    >();

    for (const activeSocket of sockets) {
      const activeParticipantId = participantKey(
        activeSocket.data.participantId as ParticipantId
      );
      if (participants.has(activeParticipantId)) continue;
      participants.set(activeParticipantId, {
        participantId: activeParticipantId,
        userId:
          typeof activeSocket.data.databaseUserId === "number" &&
          Number.isInteger(activeSocket.data.databaseUserId)
            ? activeSocket.data.databaseUserId
            : null,
        displayName: String(activeSocket.data.displayName || "Group member"),
        isAnonymous: Boolean(activeSocket.data.isAnonymous),
      });
    }

    this.io.to(room).emit("group:presence", {
      groupId,
      count: participants.size,
      members: [...participants.values()],
    });
  }

  private broadcastOnlineCount() {
    this.io.emit("stats:online-count", {
      count: this.participantSockets.size,
    });
  }

  public getIO() {
    return this.io;
  }

  public getUserSocketId(userId: number) {
    return this.participantSockets.get(participantKey(userId));
  }

  public getOnlineCount() {
    return this.participantSockets.size;
  }

  /** Immediately remove a banned member from every live group/call socket. */
  public async disconnectGroupUser(
    groupId: number,
    userId: number,
    banType: "temporary" | "permanent"
  ) {
    const sockets = await this.io.fetchSockets();
    const targets = sockets.filter(
      socket => Number(socket.data.databaseUserId) === userId
    );
    await Promise.all(
      targets.map(async targetSocket => {
        targetSocket.emit("group:access-revoked", {
          groupId,
          banType,
          message:
            banType === "permanent"
              ? "You were permanently banned from this group."
              : "You were temporarily banned from this group.",
        });
        await targetSocket.disconnect(true);
      })
    );
  }
}

let activeSocketManager: SocketManager | null = null;

export function initializeSocket(httpServer: HTTPServer) {
  activeSocketManager = new SocketManager(httpServer);
  return activeSocketManager;
}

export async function disconnectGroupUser(
  groupId: number,
  userId: number,
  banType: "temporary" | "permanent"
) {
  await activeSocketManager?.disconnectGroupUser(groupId, userId, banType);
}

export { SocketManager };
