import type { User } from "../drizzle/schema";

export function isGuestUser(user: Pick<User, "openId"> | null | undefined) {
  return Boolean(user?.openId.startsWith("guest_"));
}

/**
 * Explicit response projections keep authentication-only fields out of tRPC
 * payloads. Never serialize a database User row directly.
 */
export function toSelfUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    country: user.country,
    age: user.age,
    role: user.role,
    isGuest: isGuestUser(user),
    isVerified: user.isVerified,
    emailVerified: user.emailVerified,
    isSuspended: user.isSuspended,
    isBanned: user.isBanned,
    lastSignedIn: user.lastSignedIn,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatar: user.avatar,
    country: user.country,
    age: user.age,
    role: user.role,
    isVerified: user.isVerified,
    lastSeenAt: user.lastSeenAt,
    createdAt: user.createdAt,
  };
}
