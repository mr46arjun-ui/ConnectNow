import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const mediaUploadRouter = router({
  uploadMedia: protectedProcedure
    .input(
      z.object({
        fileName: z.string().min(1).max(255),
        fileType: z.enum(["image", "video", "audio", "document"]),
        mimeType: z.string().min(1).max(100),
        fileSize: z.number().int().positive().max(100 * 1024 * 1024), // 100MB
        s3Key: z.string().min(1).max(512),
        s3Url: z.string().url(),
        messageId: z.number().int().positive().optional(),
        groupMessageId: z.number().int().positive().optional(),
        thumbnail: z.string().url().optional(),
        duration: z.number().int().positive().optional(),
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      db.createMediaUpload({
        uploadedBy: ctx.user.id,
        ...input,
      })
    ),

  getMessageMedia: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .query(({ input }) => db.getMessageMediaUploads(input.messageId)),

  getGroupMessageMedia: protectedProcedure
    .input(z.object({ groupMessageId: z.number().int().positive() }))
    .query(({ input }) => db.getGroupMessageMediaUploads(input.groupMessageId)),

  getUserMedia: protectedProcedure
    .input(
      z.object({
        userId: z.number().int().positive(),
        limit: z.number().int().positive().max(200).default(50),
      })
    )
    .query(({ input }) => db.getUserMediaUploads(input.userId, input.limit)),

  deleteMedia: protectedProcedure
    .input(z.object({ mediaId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const media = await db.getMediaUpload(input.mediaId);
      if (!media) throw new TRPCError({ code: "NOT_FOUND" });
      if (media.uploadedBy !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.deleteMediaUpload(input.mediaId);
      return { success: true } as const;
    }),
});
