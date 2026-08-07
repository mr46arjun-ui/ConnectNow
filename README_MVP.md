# ConnectNow MVP (Historical Plan)

> Historical planning document. Group features mentioned below are not exposed
> in the production release. See `README.md` for current behavior.

**ConnectNow** is a real-time video chat platform that connects users for instant conversations through video, audio, and text messaging. Built with React, Node.js, WebRTC, and Socket.IO.

## Features

### Core Features ✅

- **Video Chat**: HD video calls with real-time audio/video streams
- **Private Messaging**: Text messaging with edit, delete, and emoji reactions
- **Group Chats**: Create groups, add members, mention users
- **Friends Management**: Add friends, send requests, manage friend list
- **User Profiles**: Customizable profiles with bio, avatar, location
- **Admin Dashboard**: User management, reports, content moderation, analytics
- **Notifications**: Real-time notifications for messages, friend requests, mentions
- **Blocking & Reports**: Block users, report inappropriate behavior

### Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, TypeScript, Wouter
- **Backend**: Node.js, Express, tRPC, TypeScript
- **Database**: MySQL 8.0, Drizzle ORM
- **Real-time**: Socket.IO, WebRTC
- **Cache**: Redis
- **Auth**: Manus OAuth, JWT sessions
- **Deployment**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Node.js 22+
- MySQL 8.0+
- Redis 7+
- Docker & Docker Compose (optional)

### Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 3. Setup database
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# 4. Start development server
pnpm dev

# 5. Open browser
# Navigate to http://localhost:3000
```

### Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Project Structure

```
connectnow/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── hooks/         # Custom hooks
│   │   └── lib/           # Utilities
│   └── public/            # Static assets
├── server/                # Node.js backend
│   ├── routers/           # tRPC routers
│   ├── db.ts              # Database queries
│   └── _core/             # Framework code
├── drizzle/               # Database schema & migrations
├── shared/                # Shared types & constants
├── Dockerfile             # Production image
├── docker-compose.yml     # Local development
└── DEPLOYMENT_FINAL.md    # Deployment guide
```

## Environment Variables

Required:

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session signing secret (min 32 chars)

Optional:

- `REDIS_URL`: Redis connection string (in-memory rate limiting is used when omitted)
- `NODE_ENV`: `production` or `development`
- `BUILT_IN_FORGE_API_URL`: Manus API URL
- `BUILT_IN_FORGE_API_KEY`: Manus API key
- `VITE_ENABLE_OAUTH`: Set to `true` to enable Manus OAuth
- `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL`, and
  `APP_PUBLIC_ORIGIN`: Required together only when OAuth is enabled

## API Documentation

See [API.md](./API.md) for complete API reference.

### Key Endpoints

**Authentication**

- `POST /api/oauth/callback` - OAuth callback
- `GET /api/trpc/auth.me` - Get current user
- `POST /api/trpc/auth.logout` - Logout

**Messaging**

- `POST /api/trpc/messages.send` - Send message
- `GET /api/trpc/messages.getConversation` - Get messages
- `POST /api/trpc/messages.edit` - Edit message
- `POST /api/trpc/messages.delete` - Delete message

**Friends**

- `GET /api/trpc/friends.getFriendsList` - Get friends
- `POST /api/trpc/friends.sendRequest` - Send request
- `POST /api/trpc/friends.acceptRequest` - Accept request

**Admin**

- `GET /api/trpc/admin.getStats` - Get statistics
- `GET /api/trpc/admin.getUsers` - List users
- `POST /api/trpc/admin.suspendUser` - Suspend user
- `POST /api/trpc/admin.banUser` - Ban user

## Testing

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

See [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md) for manual testing guide.

## Deployment

### Quick Deploy Options

**Docker Compose** (Self-hosted)

```bash
docker-compose up -d
```

**AWS ECS/Fargate**

- See [DEPLOYMENT_FINAL.md](./DEPLOYMENT_FINAL.md) for detailed steps

**Google Cloud Run**

- See [DEPLOYMENT_FINAL.md](./DEPLOYMENT_FINAL.md) for detailed steps

**Heroku**

```bash
git push heroku main
```

**Railway**

- Connect GitHub repo, add MySQL & Redis services

See [DEPLOYMENT_FINAL.md](./DEPLOYMENT_FINAL.md) for complete deployment guide.

## Performance

- Page load: < 3 seconds
- Message send: < 500ms
- Video call setup: < 2 seconds
- Database queries: < 100ms (with indexes)
- WebSocket latency: < 50ms

## Security

- HTTPS/TLS encryption
- JWT session tokens
- Input validation & sanitization
- SQL injection prevention (Drizzle ORM)
- XSS protection
- CSRF protection
- Rate limiting
- Content moderation

## Monitoring

- Application logs in `.manus-logs/`
- Health check: `GET /health`
- Performance metrics via admin dashboard
- Real-time user analytics
- Error tracking

## Troubleshooting

### Database connection failed

```bash
# Check connection string
echo $DATABASE_URL

# Test MySQL connection
mysql -h host -u user -p -e "SELECT 1"
```

### Redis connection failed

```bash
# Test Redis connection
redis-cli ping

# Check Redis memory
redis-cli info memory
```

### WebSocket connection failed

- Check firewall allows port 3000
- Verify CORS settings
- Check SSL certificate (if using HTTPS)
- Review browser console for errors

See [DEPLOYMENT_FINAL.md](./DEPLOYMENT_FINAL.md) for more troubleshooting.

## Development

### Code Quality

```bash
# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Format
pnpm format
```

### Database Migrations

```bash
# Generate migration
pnpm drizzle-kit generate

# Apply migration
pnpm drizzle-kit migrate

# Drop database (dev only)
pnpm drizzle-kit drop
```

### Build

```bash
# Build frontend and backend
pnpm build

# Start production build
NODE_ENV=production node dist/index.js
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

## Roadmap

### Phase 2 (Post-MVP)

- [ ] Password reset flow
- [ ] File uploads & media sharing
- [ ] Matching algorithm & random chat
- [ ] Advanced moderation AI
- [ ] Email/SMS notifications
- [ ] Video recording & playback
- [ ] Screen sharing
- [ ] Call history
- [ ] User analytics

### Phase 3

- [ ] Mobile app (React Native)
- [ ] Desktop app (Electron)
- [ ] Advanced search
- [ ] User recommendations
- [ ] Scheduled calls
- [ ] Live streaming
- [ ] Marketplace/monetization

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:

1. Check [TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)
2. Review [DEPLOYMENT_FINAL.md](./DEPLOYMENT_FINAL.md)
3. Check application logs
4. Review [API.md](./API.md)

## Authors

Built with ❤️ by the ConnectNow team

---

**Ready to deploy?** See [DEPLOYMENT_FINAL.md](./DEPLOYMENT_FINAL.md) for step-by-step instructions.
