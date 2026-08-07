import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { desc, eq, or, sql, max } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { getDb } from "../db";
import { privateMessages, users } from "../../drizzle/schema";

export const messagesRouter = router({
  /**
   * Send a private message
   */
  send: protectedProcedure
    .input(
      z.object({
        recipientId: z.number().int().positive(),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.recipientId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot send to yourself",
        });
      }
      const recipient = await db.getUserById(input.recipientId);
      if (!recipient) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Recipient not found",
        });
      }
      if (recipient.isBanned || recipient.isSuspended) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Recipient unavailable",
        });
      }
      if (!(await db.canUsersMessage(ctx.user.id, input.recipientId))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Messages are available between friends who have not blocked each other",
        });
      }
      const messageId = await db.createPrivateMessage(
        ctx.user.id,
        input.recipientId,
        input.content
      );
      await db.createNotification(
        input.recipientId,
        "message",
        `New message from ${ctx.user.name ?? ctx.user.username ?? "Someone"}`,
        input.content.slice(0, 200),
        ctx.user.id
      );
      return { success: true, messageId, timestamp: new Date() } as const;
    }),

  /**
   * Edit a message. Only the sender can edit, and only within 24 hours.
   */
  edit: protectedProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
        content: z.string().min(1).max(5000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const conn = await getDb();
      if (!conn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (
        await conn
          .select()
          .from(privateMessages)
          .where(eq(privateMessages.id, input.messageId))
          .limit(1)
      )[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.senderId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const ageMs = Date.now() - new Date(existing.createdAt).getTime();
      if (ageMs > 24 * 60 * 60 * 1000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Edit window expired",
        });
      }
      await db.editPrivateMessage(input.messageId, input.content);
      return { success: true, messageId: input.messageId } as const;
    }),

  /**
   * Soft-delete a message. Only the sender can delete their own messages.
   */
  delete: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const conn = await getDb();
      if (!conn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (
        await conn
          .select()
          .from(privateMessages)
          .where(eq(privateMessages.id, input.messageId))
          .limit(1)
      )[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.senderId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deletePrivateMessage(input.messageId);
      return { success: true } as const;
    }),

  markAsRead: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const conn = await getDb();
      if (!conn) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = (
        await conn
          .select()
          .from(privateMessages)
          .where(eq(privateMessages.id, input.messageId))
          .limit(1)
      )[0];
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
      if (existing.receiverId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.markPrivateMessageAsRead(input.messageId);
      return { success: true } as const;
    }),

  getConversation: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        limit: z.number().int().positive().max(200).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!(await db.canUsersMessage(ctx.user.id, input.userId))) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getPrivateMessages(ctx.user.id, input.userId, input.limit);
    }),

  /**
   * Inbox summary: per-user most recent message + unread count.
   * Used by the MainChat view in place of mock data.
   */
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const conn = await getDb();
    if (!conn) return [];
    const callerId = ctx.user.id;

    // My conversation partners and the latest message in each direction.
    const partners = await conn.execute(
      sql`SELECT
            CASE WHEN senderId = ${callerId} THEN receiverId ELSE senderId END AS otherUserId,
            MAX(id) AS lastMessageId,
            MAX(createdAt) AS lastMessageAt
          FROM private_messages
          WHERE senderId = ${callerId} OR receiverId = ${callerId}
          GROUP BY otherUserId
          ORDER BY lastMessageAt DESC
          LIMIT 100`
    );
    const partnerRows = (partners as unknown as any)[0] as Array<{
      otherUserId: number;
      lastMessageId: number;
      lastMessageAt: Date | string;
    }>;
    if (!partnerRows?.length) return [];

    const partnerIds = partnerRows.map(p => p.otherUserId);
    const partnerInfo = await conn
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar,
      })
      .from(users)
      .where(
        sql`${users.id} IN (${sql.join(
          partnerIds.map(id => sql`${id}`),
          sql`, `
        )})`
      );
    const partnerMap = new Map(partnerInfo.map(u => [u.id, u]));

    const lastMessages = (await conn
      .select()
      .from(privateMessages)
      .where(
        sql`${privateMessages.id} IN (${sql.join(
          partnerRows.map(p => p.lastMessageId).map(id => sql`${id}`),
          sql`, `
        )})`
      )) as Array<{
      id: number;
      content: string;
      isDeleted: boolean | null;
    }>;
    const lastMap = new Map<
      number,
      { content: string; isDeleted: boolean | null }
    >(lastMessages.map(m => [m.id, m]));

    const unreadResult = await conn.execute(
      sql`SELECT senderId AS otherUserId, COUNT(*) AS unread
          FROM private_messages
          WHERE receiverId = ${callerId} AND isRead = false AND isDeleted = false
          GROUP BY senderId`
    );
    const unreadRows = (unreadResult as unknown as any)[0] as Array<{
      otherUserId: number;
      unread: number;
    }>;
    const unreadMap = new Map(
      unreadRows.map(u => [u.otherUserId, Number(u.unread ?? 0)])
    );

    return partnerRows.map(p => {
      const partner = partnerMap.get(p.otherUserId) as
        | {
            username: string | null;
            name: string | null;
            avatar: string | null;
          }
        | undefined;
      const last = lastMap.get(p.lastMessageId);
      return {
        id: p.otherUserId,
        userId: p.otherUserId,
        username: partner?.username ?? partner?.name ?? `User ${p.otherUserId}`,
        avatar: partner?.avatar ?? null,
        lastMessage: last?.isDeleted
          ? "[Message deleted]"
          : (last?.content ?? ""),
        lastMessageTime: p.lastMessageAt,
        unreadCount: unreadMap.get(p.otherUserId) ?? 0,
      };
    });
  }),

  addReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
        emoji: z.string().min(1).max(10),
      })
    )
    .mutation(({ ctx, input }) =>
      db.addMessageReaction(input.messageId, ctx.user.id, input.emoji).then(
        () =>
          ({
            success: true,
            emoji: input.emoji,
          }) as const
      )
    ),

  removeReaction: protectedProcedure
    .input(
      z.object({
        messageId: z.number().int().positive(),
        emoji: z.string().min(1).max(10),
      })
    )
    .mutation(({ ctx, input }) =>
      db.removeMessageReaction(input.messageId, ctx.user.id, input.emoji).then(
        () =>
          ({
            success: true,
          }) as const
      )
    ),
});
