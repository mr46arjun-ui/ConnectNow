import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { users, groups } from "../../drizzle/schema";
import { startOfDay, startOfWeek, startOfMonth } from "date-fns";

export const adminRouter = router({
  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const onlineUsers = await db.getOnlineUsers();
    const dbConn = await db.getDb();
    if (!dbConn) {
      return { onlineCount: onlineUsers.length, timestamp: new Date() };
    }
    const totalUsers = await db.countUsers();
    const bannedUsers = await db.countUsers({ banned: true });
    const suspendedUsers = await db.countUsers({ suspended: true });
    return {
      onlineCount: onlineUsers.length,
      totalUsers,
      bannedUsers,
      suspendedUsers,
      timestamp: new Date(),
    };
  }),

  getOnlineUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getOnlineUsers();
  }),

  suspendUser: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const target = await db.getUserById(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot suspend an admin" });
      }
      await db.updateUser(input.userId, { isSuspended: true });
      await db.createModerationLog(ctx.user.id, "suspend", input.userId, undefined, input.reason);
      return { success: true } as const;
    }),

  banUser: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const target = await db.getUserById(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "admin") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot ban an admin" });
      }
      await db.updateUser(input.userId, { isBanned: true, isSuspended: true });
      await db.createModerationLog(ctx.user.id, "ban", input.userId, undefined, input.reason);
      return { success: true } as const;
    }),

  unbanUser: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.updateUser(input.userId, { isBanned: false, isSuspended: false });
      await db.createModerationLog(ctx.user.id, "unban", input.userId);
      return { success: true } as const;
    }),

  getAnalytics: protectedProcedure
    .input(z.object({ period: z.enum(["day", "week", "month"]).default("day") }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const from =
        input.period === "day"
          ? startOfDay(new Date())
          : input.period === "week"
            ? startOfWeek(new Date())
            : startOfMonth(new Date());
      const dbConn = await db.getDb();
      if (!dbConn) {
        return {
          period: input.period,
          timestamp: new Date(),
          messageVolume: 0,
          dailyActiveUsers: 0,
        };
      }
      const [volume, dau] = await Promise.all([
        db.countMessagesSince(from),
        db.dailyActiveUsersSince(from),
      ]);
      return {
        period: input.period,
        timestamp: new Date(),
        messageVolume: volume,
        dailyActiveUsers: dau,
      };
    }),

  getHealthMetrics: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const dbConn = await db.getDb();
    if (!dbConn) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        bannedUsers: 0,
        uptime: process.uptime(),
        timestamp: new Date(),
      };
    }
    const [totalUsers, activeUsers, bannedUsers] = await Promise.all([
      db.countUsers(),
      db.countOnlineUsers(),
      db.countUsers({ banned: true }),
    ]);
    return {
      totalUsers,
      activeUsers,
      bannedUsers,
      uptime: process.uptime(),
      timestamp: new Date(),
    };
  }),

  listAllUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const dbConn = await db.getDb();
    if (!dbConn) return [];
    const allUsers = await dbConn.select().from(users);
    return allUsers.map(u => ({
      id: u.id,
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      isBanned: Boolean(u.isBanned),
      isSuspended: Boolean(u.isSuspended),
      createdAt: u.createdAt,
    }));
  }),

  setUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        role: z.enum(["user", "moderator", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin and Co-Admins can assign staff roles" });
      }
      if (input.role === "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only full Admins can assign Admin role" });
      }
      const target = await db.getUserById(input.userId);
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });
      if (target.role === "admin" && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot modify super admin" });
      }
      await db.updateUser(input.userId, { role: input.role });
      await db.createModerationLog(ctx.user.id, "set_role", input.userId, undefined, `Role updated to ${input.role}`);
      return { success: true, userId: input.userId, role: input.role };
    }),

  listGroups: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const dbConn = await db.getDb();
    if (!dbConn) return [];
    return dbConn.select().from(groups);
  }),

  createGroup: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(500).optional(),
        password: z.string().trim().max(50).optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const { createGroup } = await import("../groups");
      return createGroup(ctx.user.id, input);
    }),

  deleteGroup: protectedProcedure
    .input(z.object({ groupId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only Admin and Co-Admins can delete groups" });
      }
      const { deleteGroupPermanently } = await import("../groups");
      return deleteGroupPermanently(input.groupId);
    }),
});

