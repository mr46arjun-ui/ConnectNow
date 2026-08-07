# ConnectNow

ConnectNow is a responsive real-time chat application for account-based text,
voice, and video conversations. It also includes an anonymous text-chat mode
that does not create an account, validate a token, query a user record, or
persist messages.

## Production release scope

Enabled and verified in this release:

- Local email/password signup, login, logout, and password reset
- User profiles, friend requests, private messages, and notifications
- Persistent group rooms, invitations, member roles, and real-time mentions
- Click-to-tag usernames, mention autocomplete, live mention pop-ups, and
  highlighted historical mentions
- Membership-checked group audio/video calls for up to six participants
- Random text, voice, and video matching
- WebRTC microphone, camera, speaker, and screen-sharing controls
- Ephemeral anonymous text chat with IP-based abuse limits
- Message validation, profanity checks, reporting, and blocking
- Responsive public, authentication, dashboard, and chat interfaces
- Automatic database migrations and schema checks before startup
- Public liveness (`/health`) and database readiness (`/ready`) endpoints

Group chat and calls are enabled with server-side membership checks on reads,
writes, invitations, member removal, socket room joins, message deletion, call
joins, and WebRTC signaling. Group calls use a six-person peer mesh with
participant limits, reconnect cleanup, persistent call records, live
invitations, and administrator/initiator end-call controls.

## Anonymous mode

Anonymous mode stores only a start time in the browser tab's
`sessionStorage`. The server assigns an in-memory socket identity and keeps the
conversation in process memory. It does not:

- create or update a database user;
- issue or validate an authentication token;
- require an email, password, profile, or cookie; or
- persist anonymous messages.

Anonymous conversations end when the socket disconnects or the server
restarts. The server still applies IP-based connection/message limits and
content-safety checks.

## Requirements

- Node.js 22 or newer
- pnpm 11
- MySQL 8
- HTTPS in production (required by browsers for camera and microphone access)
- Redis is optional; in-memory rate limiting is used when it is not configured
- A TURN relay is recommended for reliable voice/video across restrictive
  mobile and corporate networks

## Local development

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

Set at least `DATABASE_URL` and a strong `JWT_SECRET` in `.env`. The
application applies committed migrations and checks the required schema before
opening its port.

## Verification

```bash
pnpm check
pnpm test
pnpm build
```

The build verifies that all committed SQL migrations are packaged with the
server. The production image starts with:

```bash
pnpm start
```

## Render deployment

Use the included `Dockerfile`. Configure:

```env
DATABASE_URL=mysql://user:password@reachable-mysql-host:3306/connectnow
JWT_SECRET=a-long-random-production-secret
RUN_DB_MIGRATIONS=true
NODE_ENV=production
```

Use `/ready` as Render's health-check path. The database user must have
permission to apply the committed migrations. Startup fails closed instead of
serving against an outdated schema.

Do not use `localhost`, `127.0.0.1`, or the example development URL for
`DATABASE_URL` on Render. Those names refer to the app container, not a MySQL
server. Render provides managed PostgreSQL rather than managed MySQL, so use a
reachable external MySQL provider or a persistent MySQL private service. The
included `render.yaml` prompts for the database URL instead of embedding a
broken default.

For reliable media calls, also set the following at build time:

```env
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=...
VITE_TURN_CREDENTIAL=...
```

See [RENDER_SETUP.md](./RENDER_SETUP.md) for the exact Render recovery steps
and [DEPLOYMENT.md](./DEPLOYMENT.md) for the full production checklist.

## Main architecture

- React 19, TypeScript, Wouter, Tailwind CSS, and TanStack Query
- Express, tRPC, and Socket.IO
- WebRTC for peer-to-peer voice/video
- MySQL with Drizzle ORM and committed SQL migrations
- Argon2 password hashes and signed HTTP-only session cookies

Source layout:

```text
client/src/          React application
server/              Express, tRPC, sockets, authentication, moderation
server/_core/        Server bootstrap and shared infrastructure
drizzle/             Schema and committed migrations
scripts/             Production build validation
```

## Operational notes

- `/health` confirms the process is alive.
- `/ready` confirms the database connection and required columns.
- Voice/video uses public STUN when TURN is not configured, but some peer pairs
  will not connect without TURN.
- Group calls are capped at six participants because they use a browser
  peer-to-peer mesh. A TURN service is strongly recommended in production.
- Anonymous matching is per application instance. Multi-instance deployments
  require a shared ephemeral socket adapter before scaling beyond one instance.
- Group messages, calls, and notifications are persistent. Multi-instance live
  delivery and signaling additionally require a shared Socket.IO adapter and
  sticky connections.

Several older planning documents are retained as historical project notes.
This README and `DEPLOYMENT.md` describe the currently supported production
surface.
