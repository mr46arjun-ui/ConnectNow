import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const reportReasonSchema = z.enum([
  "harassment",
  "inappropriate_content",
  "spam",
  "impersonation",
  "other",
]);

export const reportsRouter = router({
  reportUser: protectedProcedure
    .input(
      z.object({
        reportedUserId: z.number().int().positive(),
        reason: reportReasonSchema,
        description: z.string().max(1000).optional(),
        sessionId: z.number().int().positive().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.reportedUserId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot report yourself" });
      }
      const target = await db.getUserById(input.reportedUserId);
      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await db.createReport(
        ctx.user.id,
        input.reportedUserId,
        input.reason,
        input.description,
        input.sessionId
      );
      return { success: true } as const;
    }),

  getReports: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getReports("pending", 50);
  }),

  updateReport: protectedProcedure
    .input(
      z.object({
        reportId: z.number().int().positive(),
        status: z
          .enum(["pending", "reviewing", "resolved", "dismissed"])
          .optional(),
        action: z.enum(["none", "warning", "suspend", "ban"]).optional(),
        moderationNotes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "moderator") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateReport(input.reportId, {
        status: input.status,
        action: input.action,
        moderatorId: ctx.user.id,
        moderationNotes: input.moderationNotes,
      });

      if (input.action === "ban" || input.action === "suspend") {
        const allReports = await db.getReports();
        const targetReport = allReports.find((r) => r.id === input.reportId);
        if (targetReport) {
          await db.updateUser(targetReport.reportedUserId, {
            isBanned: input.action === "ban",
            isSuspended: input.action === "suspend",
          });
          await db.createModerationLog(
            ctx.user.id,
            input.action,
            targetReport.reportedUserId,
            input.reportId,
            input.moderationNotes
          );
        }
      }

      return { success: true } as const;
    }),
});
