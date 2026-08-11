import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  banGroupMember,
  createGroup,
  deleteGroupMessage,
  getActiveGroupCall,
  getGroupCallForMember,
  getGroupForMember,
  inviteGroupMember,
  leaveGroup,
  listGroupInvites,
  listGroupBans,
  listGroupMembers,
  listGroupCallParticipants,
  listGroupMessages,
  listUserGroups,
  markGroupRead,
  removeMemberFromGroup,
  respondToGroupInvite,
  setGroupMemberRole,
  unbanGroupMember,
  updateGroupDetails,
} from "../groups";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { consumeRate } from "../security";
import { disconnectGroupUser } from "../socket";

const groupIdSchema = z.number().int().positive();

export const groupsRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().trim().min(2).max(80),
        description: z.string().trim().max(500).optional(),
        password: z.string().trim().max(50).optional(),
        isPrivate: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const creatorId = ctx.user.id;
      const rateKey = `groups.create:${ctx.user.id}`;
      const rate = await consumeRate(rateKey, 10, 60 * 60 * 1_000);
      if (!rate.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many groups created. Please try again later.",
        });
      }
      const group = await createGroup(creatorId, input);
      if (!group) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return group;
    }),

  list: publicProcedure.query(({ ctx }) =>
    listUserGroups(ctx.user?.id ?? 0)
  ),

  getById: publicProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .query(async ({ ctx, input }) => {
      const group = await getGroupForMember(input.groupId, ctx.user?.id ?? 0);
      if (!group) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This group is not available",
        });
      }
      return group;
    }),

  getMembers: publicProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .query(async ({ ctx, input }) => {
      const members = await listGroupMembers(input.groupId, ctx.user?.id ?? 0);
      if (!members) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }
      return members.map(member => ({
        ...member,
        handle: member.username || `user${member.userId}`,
        displayName: member.name || member.username || `User ${member.userId}`,
      }));
    }),

  getMessages: publicProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        limit: z.number().int().min(1).max(100).default(80),
      })
    )
    .query(async ({ ctx, input }) => {
      const messages = await listGroupMessages(
        input.groupId,
        ctx.user?.id ?? 0,
        input.limit
      );
      if (!messages) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You are not a member of this group",
        });
      }
      return messages;
    }),

  getActiveCall: publicProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .query(({ ctx, input }) =>
      getActiveGroupCall(input.groupId, ctx.user?.id ?? 0)
    ),

  getCall: publicProcedure
    .input(z.object({ callId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const call = await getGroupCallForMember(input.callId, ctx.user?.id ?? 0);
      if (!call) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This group call is not available",
        });
      }
      const participants = call.endedAt
        ? []
        : ((await listGroupCallParticipants(input.callId, ctx.user?.id ?? 0)) ?? []);
      return { call, participants };
    }),

  update: protectedProcedure
    .input(
      z
        .object({
          groupId: groupIdSchema,
          name: z.string().trim().min(2).max(80).optional(),
          description: z.string().trim().max(500).optional(),
        })
        .refine(
          value => value.name !== undefined || value.description !== undefined
        )
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = await updateGroupDetails(input.groupId, ctx.user.id, {
        name: input.name,
        description: input.description,
      });
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the group administrator can update this group",
        });
      }
      return { success: true } as const;
    }),

  invite: protectedProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rate = await consumeRate(
        `groups.invite:${ctx.user.id}`,
        30,
        60 * 60 * 1_000
      );
      if (!rate.allowed) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many invitations sent. Please try again later.",
        });
      }
      const allowed = await inviteGroupMember(
        input.groupId,
        ctx.user.id,
        input.userId
      );
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Only group managers can invite friends who have not blocked them",
        });
      }
      return { success: true } as const;
    }),

  getInvites: protectedProcedure.query(({ ctx }) =>
    listGroupInvites(ctx.user.id)
  ),

  respondToInvite: protectedProcedure
    .input(
      z.object({
        inviteId: z.number().int().positive(),
        accept: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await respondToGroupInvite(
        input.inviteId,
        ctx.user.id,
        input.accept
      );
      if (!result) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "This invitation is no longer available",
        });
      }
      return result;
    }),

  setMemberRole: protectedProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        userId: z.number().int().positive(),
        role: z.enum(["co_admin", "moderator", "member"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = await setGroupMemberRole(
        input.groupId,
        ctx.user.id,
        input.userId,
        input.role
      );
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot change this member's group role",
        });
      }
      return { success: true } as const;
    }),

  banMember: protectedProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        userId: z.number().int().positive(),
        banType: z.enum(["temporary", "permanent"]),
        durationMinutes: z.number().int().min(1).max(525_600).optional(),
        reason: z.string().trim().min(2).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = await banGroupMember(
        input.groupId,
        ctx.user.id,
        input.userId,
        input
      );
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot ban this group member",
        });
      }
      await disconnectGroupUser(input.groupId, input.userId, input.banType);
      return { success: true } as const;
    }),

  getBans: protectedProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .query(async ({ ctx, input }) => {
      const bans = await listGroupBans(input.groupId, ctx.user.id);
      if (!bans) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the group administrator can view bans",
        });
      }
      return bans;
    }),

  unbanMember: protectedProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = await unbanGroupMember(
        input.groupId,
        ctx.user.id,
        input.userId
      );
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the group administrator can remove bans",
        });
      }
      return { success: true } as const;
    }),

  removeMember: protectedProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        userId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = await removeMemberFromGroup(
        input.groupId,
        ctx.user.id,
        input.userId
      );
      if (!allowed) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot remove this group member",
        });
      }
      return { success: true } as const;
    }),

  leave: protectedProcedure
    .input(z.object({ groupId: groupIdSchema }))
    .mutation(async ({ ctx, input }) => {
      const allowed = await leaveGroup(input.groupId, ctx.user.id);
      if (!allowed) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The group creator cannot leave this room.",
        });
      }
      return { success: true } as const;
    }),

  markRead: protectedProcedure
    .input(
      z.object({
        groupId: groupIdSchema,
        messageId: z.number().int().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const allowed = await markGroupRead(
        input.groupId,
        ctx.user.id,
        input.messageId
      );
      if (!allowed) throw new TRPCError({ code: "FORBIDDEN" });
      return { success: true } as const;
    }),

  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteGroupMessage(input.messageId, ctx.user.id);
      if (!result) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You cannot delete this message",
        });
      }
      return result;
    }),
});
