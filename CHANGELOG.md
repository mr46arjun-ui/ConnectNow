# ConnectNow Patch — July 2026

This patch fixes the critical security and correctness issues called out in the
inspection report. Apply it on top of the original `connectnow-complete.zip`.

## What changed

### Security (P0)
1. **Socket.IO impersonation** (`server/socket.ts`)
   - The previous middleware trusted `handshake.auth.userId`. Any client could
     send any userId and act as that user.
   - Replaced with session-cookie-based auth: parses the cookie, verifies the
     JWT via `sdk.verifySession`, looks up the user, rejects banned/suspended
     users. Mirrors the HTTP auth path.
2. **OAuth state decoding** (`server/_core/sdk.ts`)
   - `decodeState` now uses `Buffer.from(state, "base64url")` and verifies the
     decoded URL's origin against `APP_PUBLIC_ORIGIN` if configured.
3. **Cookie `secure` flag spoofing** (`server/_core/cookies.ts`)
   - `isSecureRequest` now requires every trusted proxy hop to forward HTTPS
     instead of accepting any single `X-Forwarded-Proto: https` from the wire.
   - `sameSite` defaults to `lax` for insecure contexts, `none` only when SSL
     is verified.
4. **Profanity list** (`server/moderation.ts`)
   - Replaced the placeholder list (`"hate"`, `"abuse"`, …) with the
     `bad-words` library. False positives removed; real profanity now flagged.
5. **Rate limiting wired** (`server/security.ts`, `server/_core/index.ts`)
   - New `consumeRate(key, limit, windowMs)` helper backed by Redis (with an
     in-memory fallback that runs at the same cadence if Redis is unreachable).
   - Express `rateLimitMiddleware` applies the bucket per-IP.
   - Mounted on `/api/oauth`, `/api/auth`, `auth.login`, `auth.signup`,
     `auth.requestPasswordReset`. Returns `429` with `Retry-After`.
6. **Password hashing introduced**
   - Added `argon2` dependency; new `server/_core/passwords.ts` with
     `hashPassword` (argon2id, OWASP-minimum 19 MiB), `verifyPassword`, and a
     policy (`passwordIsStrongEnough`) requiring 8-128 chars with both letters
     and digits.

### Correctness
7. **messageCount race** (`server/db.ts`)
   - Old code did a SELECT+UPDATE composing the count from a subquery, which
     Drizzle rejects. Now an atomic `messageCount + 1` increment.
8. **Group call duration** (`server/groups.ts`)
   - `removeGroupCallParticipant` and `endGroupCall` were computing
     `Date.now() - new Date().getTime()` (0 seconds). Now they read the row's
     `joinedAt` / `startedAt` and compute the actual duration.
9. **Expired guest cleanup** (`server/guest.ts`, `server/_core/index.ts`)
   - `deleteExpiredGuestUsers` was previously a no-op. Now it issues a real
     Drizzle delete on `users.openId LIKE 'guest_%' AND createdAt < cutoff`.
   - Scheduled via `node-cron` at minute 15 of every hour when `NODE_ENV=
     production` or `ENABLE_CRON=true`.
10. **getFriendsList** (`server/db.ts`)
    - Removed the dead `Math.min(userId, 999999)` computation. Trusts the
      canonical lower-id ordering and respects the index.
11. **Soft delete for `privateMessages`** (`server/db.ts`)
    - The previous code overwrote `content = "[Message deleted]"`, losing the
      original text and breaking the audit trail. Now sets `isDeleted = true`.
12. **`moderateMessage` flag rows** (`server/socket.ts`)
    - Was called with `messageId = 0` *before* insertion, so flags pointed at a
      non-existent row. Now persists the message first, then flags with the
      real insert id.

### Real auth flow
13. **signup / login / requestPasswordReset / resetPassword / changePassword**
    (`server/routers/auth.ts`, `client/src/pages/Login.tsx`, `Signup.tsx`,
    `PasswordReset.tsx`)
    - Replaced the four "TODO" handlers that returned `{success: true}` with
      full implementations: argon2id hashing, conflict checks, session token
      issuance on success, structured errors, account enumeration prevention.
    - New `Login.tsx` page added; `Signup.tsx` rewritten to actually call
      `trpc.auth.signup`.
    - `PasswordReset.tsx` two-step flow wired to `requestPasswordReset` /
      `resetPassword`.
14. **Auth router consolidation**
    - Removed the orphan `server/routers/auth.ts` + `guest.ts` shadow files
      that conflicted with the inline definitions in `routers.ts`. Now all
      procedures live in `server/routers/*.ts` and are mounted by
      `server/_core/appRouter.ts`.
15. **Schema additions** (`drizzle/schema.ts`, `drizzle/0006_auth_security.sql`)
    - Added `passwordHash`, `emailVerified`, `lastSeenAt`, and
      `privateMessages.isDeleted/isEdited/editedAt`.
    - Migration journal updated.

### Frontend wiring
16. **tRPC + React Query provider** (`client/src/lib/trpc.ts`, `App.tsx`)
    - Added `httpBatchLink` + `superjson` + `loggerLink` and a lazy
      `createQueryClient`. `App.tsx` now mounts `trpc.Provider` /
      `QueryClientProvider` so existing `trpc.*.useQuery()` calls actually run.
17. **MainChat** (`client/src/pages/MainChat.tsx`)
    - Replaced hard-coded mock data with `trpc.messages.getConversations` and
      `trpc.groups.list`. Group creation calls `trpc.groups.create`. Loading,
      empty, and error states handled.
18. **Email verification pages** left with the previous generic UI; the server-
    side `authRouter.verifyEmail` now requires a real token and flips
    `emailVerified = true`.

### Module fixups
19. **`server/auth.logout.test.ts`** — Updated to import the new
    `_core/appRouter` and to construct an `AuthenticatedUser` that matches the
    current drizzle schema (no `loginMethod`, has `emailVerified`, `lastSeenAt`).
20. **New test** — `server/auth.integration.test.ts` exercises the real router
    via `appRouter.createCaller` for signup / login / password reset / change
    password. Uses an in-memory mock of `server/db` to keep tests offline.
21. **Dependency hygiene** (`package.json`)
    - `vitest` bumped to `^3.0.5` (compatible with Vite 7).
    - Dropped: unused `add`, `pnpm` (devDep), `wouter@3.7.1.patch`,
      `@types/bad-words` (`bad-words@4` ships its own TypeScript types so
      the DefinitelyTyped package is unnecessary and not at the version npm
      expects).
    - Added: `argon2 ^0.41.1`, `bad-words ^4.0.0`, `node-cron ^3.0.3`,
      `@types/node-cron ^3.0.11`, `next-themes ^0.4.6` (re-added — the
      `sonner.tsx` toaster imports `useTheme` from it).
22. **CI scripts** (`package.json`) — added `db:generate` and `db:migrate`
    aliases.

## What still needs follow-up

These were called out in the inspection report but didn't block the MVP
deployment. Schedule them next:

- Real email delivery for password reset / email verification (currently the
  reset token is logged to stdout in dev — replace with a transactional email
  provider before going public).
- Multi-instance Socket.IO via Redis adapter (currently the in-memory
  `waitingQueue` only matches within a single node).
- `findMatch` should push the filter into SQL (currently in-memory over up to
  200 candidates).
- Add Vitest-driven CI on GitHub Actions.
- Replace the SSL/TLS termination assumptions with explicit `APP_PUBLIC_ORIGIN`
  and `TRUST_PROXY_HOPS` env wiring.
- WebSocket TURN configuration and ICE servers for production use.
- Move from `vitest @^3 + vite @^7` self-build to a vetted test setup if the
  user prefers stability over feature bleeding.

## How to verify locally

```bash
pnpm install
pnpm db:generate      # if schema changes require it
pnpm db:migrate       # applies 0006_auth_security.sql
pnpm check            # tsc --noEmit
pnpm test             # vitest run
pnpm dev              # starts the server on :3000
```

The expected error surface after the fixes:
- `/api/trpc/auth.signup` with a duplicate email → `CONFLICT`
- `/api/trpc/auth.login` with wrong password → `UNAUTHORIZED`
- Hit `/api/trpc/auth.login` >10/min from the same IP → `429`
- Send a Socket.IO connect with no cookie → disconnect with `Unauthenticated`.
