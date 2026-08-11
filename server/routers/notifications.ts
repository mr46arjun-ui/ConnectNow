import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const notificationsRouter = router({
  getNotifications: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional() }))
    .query(({ ctx, input }) =>
      db.getUserNotifications(ctx.user.id, input.limit ?? 50)
    ),

  list: protectedProcedure
    .input(z.object({ limit: z.number().int().positive().max(100).optional() }))
    .query(({ ctx, input }) =>
      db.getUserNotifications(ctx.user.id, input.limit ?? 50)
    ),

  markAsRead: protectedProcedure
    .input(z.object({ notificationId: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      db
        .markNotificationAsRead(input.notificationId, ctx.user.id)
        .then(() => ({ success: true }) as const)
    ),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const notes = await db.getUserNotifications(ctx.user.id, 1000);
    return notes.filter(n => !n.isRead).length;
  }),
});
