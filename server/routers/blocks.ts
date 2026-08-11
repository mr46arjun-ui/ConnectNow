import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { toPublicUser } from "../user-views";

export const blocksRouter = router({
  blockUser: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.userId) {
        return { success: true } as const;
      }
      await db.blockUser(ctx.user.id, input.userId, input.reason);
      return { success: true } as const;
    }),

  unblockUser: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.unblockUser(ctx.user.id, input.userId);
      return { success: true } as const;
    }),

  getBlockedUsers: protectedProcedure.query(async ({ ctx }) => {
    const users = await db.getBlockedUsers(ctx.user.id);
    return users.map(toPublicUser);
  }),

  isBlocked: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(({ ctx, input }) => {
      return db.isUserBlocked(ctx.user.id, input.userId);
    }),
});
