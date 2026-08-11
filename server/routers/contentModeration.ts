import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const contentModerationRouter = router({
  getUnreviewedFlags: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getUnreviewedFlags(50);
  }),

  reviewFlag: protectedProcedure
    .input(
      z.object({
        flagId: z.number().int().positive(),
        verdict: z.enum(["approved", "rejected"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.reviewContentFlag(input.flagId, input.verdict, ctx.user.id);
      return { success: true } as const;
    }),

  getStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getModerationStats();
  }),
});
