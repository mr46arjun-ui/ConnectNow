import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const interestSchema = z.string().min(1).max(64);

export const matchingRouter = router({
  getPreferences: protectedProcedure.query(({ ctx }) => {
    return db.getMatchingPreferences(ctx.user.id);
  }),

  updatePreferences: protectedProcedure
    .input(
      z.object({
        genderFilter: z.enum(["male", "female", "any"]).optional(),
        countryFilter: z.array(z.string()).optional(),
        languageFilter: z.array(z.string()).optional(),
        ageMin: z.number().int().min(13).max(120).optional(),
        ageMax: z.number().int().min(13).max(120).optional(),
        interestTags: z.array(interestSchema).optional(),
      })
    )
    .mutation(({ ctx, input }) =>
      db.createOrUpdateMatchingPreferences(ctx.user.id, input)
    ),

  skipMatch: protectedProcedure
    .input(z.object({ matchedUserId: z.number().int().positive() }))
    .mutation(({ ctx, input }) =>
      db.trackAnalyticsEvent(ctx.user.id, "match_skipped", {
        skippedUserId: input.matchedUserId,
      })
    ),

  /**
   * Find a candidate user outside the caller's block list.
   * Ranking is interest-overlap Jaccard.
   */
  findMatch: protectedProcedure.query(async ({ ctx }) => {
    const callerId = ctx.user.id;
    const blocked = await db.getBlockedUsersForCaller(callerId);
    const blockedIds = new Set(blocked.map((b) => b.blockedId));
    const blockerMe = new Set(
      (await db.getUsersWhoBlockedCaller(callerId)).map((u) => u.id)
    );

    const candidates = await db.getActiveMatchCandidates(callerId, 200);

    const userInterests = (ctx.user as any).interests as string[] | undefined ?? [];

    const scored = candidates
      .filter((c) => !blockedIds.has(c.id) && !blockerMe.has(c.id))
      .map((c) => {
        const candidateInterests = (c as any).interests as string[] | undefined ?? [];
        const overlap = userInterests.filter((i) => candidateInterests.includes(i)).length;
        const union = new Set([...userInterests, ...candidateInterests]).size || 1;
        return { ...c, matchScore: overlap / union };
      })
      .sort((a, b) => (b.matchScore as number) - (a.matchScore as number));

    return scored[0] ?? null;
  }),
});
