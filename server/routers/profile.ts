import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_-]+$/, "Letters, digits, underscore, hyphen");
const interestSchema = z.string().min(1).max(64);

export const profileRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        country: user.country,
        age: user.age,
        isVerified: user.isVerified,
        role: user.role,
      };
    }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        username: usernameSchema.optional(),
        bio: z.string().max(500).optional(),
        country: z.string().max(64).optional(),
        age: z.number().int().min(13).max(120).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.updateUser(ctx.user.id, input);
    }),

  updateExtendedProfile: protectedProcedure
    .input(
      z.object({
        interests: z.array(interestSchema).optional(),
        languages: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return db.createOrUpdateUserProfile(ctx.user.id, input);
    }),

  getInterests: protectedProcedure.query(() => {
    return [
      "Music",
      "Sports",
      "Gaming",
      "Art",
      "Technology",
      "Travel",
      "Food",
      "Fitness",
      "Movies",
      "Books",
      "Photography",
      "Fashion",
      "Business",
      "Science",
      "Nature",
    ];
  }),
});
