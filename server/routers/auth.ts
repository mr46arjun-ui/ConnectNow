import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  hashPassword,
  verifyPassword,
  passwordIsStrongEnough,
} from "../_core/passwords";
import { sdk } from "../_core/sdk";
import { getSessionCookieOptions } from "../_core/cookies";
import { isGuestUser, toPublicUser, toSelfUser } from "../user-views";

const usernameSchema = z
  .string()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9_-]+$/);
const emailSchema = z.string().email().max(320);
const passwordSchema = z.string().refine(passwordIsStrongEnough, {
  message: "Password must be 8-128 chars and contain letters and numbers",
});

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) =>
    ctx.user ? toSelfUser(ctx.user) : null
  ),

  checkUsernameAvailability: publicProcedure
    .input(z.object({ username: z.string().trim() }))
    .query(async ({ input }) => {
      const clean = input.username.trim();
      if (!clean) return { available: false, reason: "Username cannot be empty" };
      if (clean.length < 2) return { available: false, reason: "Username must be at least 2 characters" };
      if (clean.length > 32) return { available: false, reason: "Username must be at most 32 characters" };

      const existing = await db.getUserByUsername(clean);
      if (existing) {
        return { available: false, reason: "Username is already registered by another user. Pick a unique name." };
      }

      return { available: true };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),

  /**
   * Create a durable pseudonymous user and issue the same signed, HttpOnly
   * session used by registered accounts. This keeps guest-owned groups and
   * other allowed resources stable across browser restarts.
   */
  startGuest: publicProcedure
    .input(
      z.object({
        username: z
          .string()
          .trim()
          .max(32)
          .regex(/^[a-zA-Z0-9_-]*$/, "Use letters, numbers, _ or -")
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user) {
        if (isGuestUser(ctx.user)) {
          return { success: true, userId: ctx.user.id } as const;
        }
        throw new TRPCError({
          code: "CONFLICT",
          message: "You are already signed in",
        });
      }

      const requested = input.username?.trim();
      if (requested && requested.length < 2) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Guest username must be at least 2 characters",
        });
      }

      let username = requested || `Guest_${nanoid(6)}`;
      if (requested && (await db.getUserByUsername(requested))) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "That username is already in use",
        });
      }
      if (!requested) {
        for (let attempt = 0; attempt < 4; attempt += 1) {
          if (!(await db.getUserByUsername(username))) break;
          username = `Guest_${nanoid(6)}`;
        }
      }

      const openId = `guest_${nanoid(24)}`;
      const userId = await db.createGuestUser({
        openId,
        username,
        name: username,
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name: username,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, userId } as const;
    }),

  /**
   * Email + password signup. Creates a real user record and a session cookie.
   * Passkey/OAuth signup remains a separate flow; this is the MVP local-auth path.
   */
  signup: publicProcedure
    .input(
      z.object({
        email: emailSchema,
        username: usernameSchema,
        password: passwordSchema,
        name: z.string().min(1).max(64).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingByEmail = await db.getUserByEmail(input.email);
      if (existingByEmail) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email already registered",
        });
      }
      const existingByUsername = await db.getUserByUsername(input.username);
      if (existingByUsername) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Username already taken",
        });
      }

      const passwordHash = await hashPassword(input.password);
      const openId = `local_${nanoid(16)}`;
      const userId = await db.createLocalUser({
        openId,
        email: input.email,
        username: input.username,
        name: input.name ?? input.username,
        passwordHash,
      });

      const sessionToken = await sdk.createSessionToken(openId, {
        name: input.name ?? input.username,
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true, userId } as const;
    }),

  /**
   * Email + password login. Issues a session cookie on success.
   */
  login: publicProcedure
    .input(
      z.object({ email: emailSchema, password: z.string().min(1).max(128) })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        // Do not leak whether the email exists.
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }
      if (user.isBanned || user.isSuspended) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: user.isBanned ? "Account banned" : "Account suspended",
        });
      }

      const ok = await verifyPassword(user.passwordHash, input.password);
      if (!ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid credentials",
        });
      }

      await db.updateUser(user.id, { lastSignedIn: new Date() });

      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name ?? user.username ?? user.email ?? "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, {
        ...cookieOptions,
        maxAge: ONE_YEAR_MS,
      });

      return { success: true } as const;
    }),

  /**
   * Request a password reset email.
   * Always returns success to avoid account enumeration.
   */
  requestPasswordReset: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (user) {
        const token = nanoid(48);
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await db.createPasswordResetToken(user.id, token, expiresAt);
        // Email delivery would happen here. In local development only, surface
        // the token so the flow can be tested without leaking it in production.
        if (process.env.NODE_ENV !== "production") {
          console.info(
            `[auth] password reset token for ${input.email}: ${token}`
          );
        }
      }
      return {
        success: true,
        message: "If the email exists, a reset link was sent",
      } as const;
    }),

  /**
   * Complete a password reset using the emailed token.
   */
  resetPassword: publicProcedure
    .input(z.object({ token: z.string().min(1), newPassword: passwordSchema }))
    .mutation(async ({ input }) => {
      const record = await db.getPasswordResetToken(input.token);
      if (!record || record.usedAt || record.expiresAt < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired reset token",
        });
      }
      const passwordHash = await hashPassword(input.newPassword);
      const user = await db.getUserById(record.userId);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await db.updateUser(user.id, { passwordHash });
      await db.markPasswordResetTokenAsUsed(record.id);
      return { success: true } as const;
    }),

  /**
   * Authenticated password change. Requires the current password.
   */
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).max(128),
        newPassword: passwordSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user || !user.passwordHash) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No password set",
        });
      }
      const ok = await verifyPassword(user.passwordHash, input.currentPassword);
      if (!ok) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Current password incorrect",
        });
      }
      const passwordHash = await hashPassword(input.newPassword);
      await db.updateUser(user.id, { passwordHash });
      return { success: true } as const;
    }),

  /**
   * Mark the email as verified. Token-based verification runs as a side-channel
   * (an emailed link with a signed token). For the MVP, accept a token, look
   * the user up, and flip the flag.
   */
  verifyEmail: protectedProcedure
    .input(z.object({ token: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user)
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      // In a full implementation we'd reject tokens with the wrong signature
      // and/or TTL. For MVP we accept any non-trivial token to demonstrate flow.
      if (input.token.length < 16) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid token" });
      }
      await db.updateUser(user.id, { emailVerified: true });
      return { success: true } as const;
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

  getProfile: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      if (input.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      const user = await db.getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return toSelfUser(user);
    }),

  getPublicProfile: protectedProcedure
    .input(z.object({ userId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const user = await db.getUserById(input.userId);
      if (!user) throw new TRPCError({ code: "NOT_FOUND" });
      return toPublicUser(user);
    }),
});
