import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { toPublicUser } from "../user-views";

export const friendsRouter = router({
  sendRequest: protectedProcedure
    .input(z.object({ receiverId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.id === input.receiverId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot send request to yourself",
        });
      }

      const receiver = await db.getUserById(input.receiverId);
      if (!receiver) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      if (await db.isUserBlocked(input.receiverId, ctx.user.id)) {
        // Quiet fail - do not leak to the user.
        return { success: true } as const;
      }

      await db.sendFriendRequest(ctx.user.id, input.receiverId);

      await db.createNotification(
        input.receiverId,
        "friend_request",
        `${ctx.user.name ?? ctx.user.username ?? "Someone"} sent you a friend request`,
        undefined,
        ctx.user.id
      );

      return { success: true } as const;
    }),

  acceptRequest: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const req = await db.acceptFriendRequest(input.requestId, ctx.user.id);
      if (!req) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }

      await db.createNotification(
        req.senderId,
        "friend_request",
        `${ctx.user.name ?? ctx.user.username ?? "Your new friend"} accepted your friend request`,
        undefined,
        ctx.user.id
      );

      return { success: true } as const;
    }),

  rejectRequest: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const ok = await db.rejectFriendRequest(input.requestId, ctx.user.id);
      if (!ok) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }
      return { success: true } as const;
    }),

  getFriendsList: protectedProcedure.query(async ({ ctx }) => {
    const friends = await db.getFriendsList(ctx.user.id);
    return friends.map(toPublicUser);
  }),

  getFriendRequests: protectedProcedure.query(async ({ ctx }) => {
    const requests = await db.getFriendRequests(ctx.user.id, "pending");
    return Promise.all(
      requests.map(async request => {
        const sender = await db.getUserById(request.senderId);
        return {
          ...request,
          sender: sender ? toPublicUser(sender) : null,
        };
      })
    );
  }),

  removeFriend: protectedProcedure
    .input(z.object({ friendId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await db.removeFriend(ctx.user.id, input.friendId);
      return { success: true } as const;
    }),
});
