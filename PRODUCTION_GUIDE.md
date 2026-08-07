# ConnectNow Production Deployment Guide

## Overview

ConnectNow is a full-stack real-time random video chat platform with text messaging, voice calls, friend system, and advanced moderation. This guide covers deployment, configuration, and operational best practices.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                       │
│  - Next.js with TypeScript                                   │
│  - Socket.IO Client for real-time                            │
│  - WebRTC for peer-to-peer media                             │
│  - Tailwind CSS 4 for styling                                │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                     │
│  - tRPC for type-safe APIs                                   │
│  - Socket.IO for real-time messaging                         │
│  - WebRTC Signaling Server                                   │
│  - LLM-based content moderation                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              Data Layer                                      │
│  - MySQL/TiDB (Primary Database)                             │
│  - Redis (Sessions, Queues, Caching)                         │
│  - S3-Compatible Storage (User Files)                        │
└─────────────────────────────────────────────────────────────┘
```

## Environment Variables

### Critical Secrets (Set via webdev_request_secrets)

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/connectnow

# Authentication
JWT_SECRET=your-secure-random-secret-min-32-chars

# Optional Manus OAuth (omit these to use local email/password login)
VITE_ENABLE_OAUTH=true
VITE_APP_ID=your-manus-oauth-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
APP_PUBLIC_ORIGIN=https://connectnow.example.com

# Storage
AWS_ACCESS_KEY_ID=your-s3-access-key
AWS_SECRET_ACCESS_KEY=your-s3-secret-key
AWS_REGION=us-east-1
S3_BUCKET=connectnow-production

# LLM Integration
OPENAI_API_KEY=your-openai-key (for content moderation)

# Redis
REDIS_URL=redis://user:password@host:6379

# Email (for notifications)
SENDGRID_API_KEY=your-sendgrid-key
```

### System-Provided Secrets

These are automatically injected by Manus:

```env
BUILT_IN_FORGE_API_KEY=provided-by-manus
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=provided-by-manus
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_ANALYTICS_ENDPOINT=provided-by-manus
VITE_ANALYTICS_WEBSITE_ID=provided-by-manus
OWNER_NAME=provided-by-manus
OWNER_OPEN_ID=provided-by-manus
```

## Database Setup

### Initial Migration

```bash
# Generate migration from schema
pnpm drizzle-kit generate

# Apply migration to database
pnpm drizzle-kit migrate
```

### Schema Overview

**Core Tables:**

- `users` - User accounts with OAuth identity
- `user_profiles` - Extended profile data (bio, interests, avatar)
- `friend_requests` - Pending friend connections
- `friends` - Accepted friendships
- `messages` - Private messages between users
- `chat_sessions` - Random chat session records
- `blocked_users` - User block list
- `reports` - User reports for moderation
- `notifications` - User notifications
- `moderation_logs` - Admin action audit trail
- `online_status` - Real-time presence tracking
- `user_interests` - Interest tags for matching
- `matching_preferences` - User filter preferences
- `content_flags` - Flagged messages for review

### Backup Strategy

```bash
# Daily automated backups
0 2 * * * mysqldump -u user -p database > /backups/connectnow-$(date +\%Y\%m\%d).sql

# Redis persistence
# Enable AOF (Append-Only File) in redis.conf:
appendonly yes
appendfsync everysec
```

## Deployment Options

### Option 1: Manus Hosting (Recommended)

The platform is built for Manus hosting with built-in support for:

- Automatic scaling
- SSL/TLS certificates
- Custom domain setup
- Built-in analytics
- Environment variable management

**Deploy:**

1. Create checkpoint via `webdev_save_checkpoint`
2. Click "Publish" button in Management UI
3. Configure custom domain in Settings → Domains

### Option 2: Docker Deployment

```bash
# Build Docker image
docker build -t connectnow:latest .

# Run with docker-compose
docker-compose up -d

# Access at http://localhost:3000
```

**docker-compose.yml includes:**

- Node.js app container
- MySQL database
- Redis cache
- Nginx reverse proxy

### Option 3: AWS Deployment

```bash
# Build for production
pnpm build

# Deploy to AWS:
# 1. Push to ECR
# 2. Create ECS task definition
# 3. Deploy to ECS Fargate
# 4. Setup RDS MySQL
# 5. Setup ElastiCache Redis
# 6. Configure CloudFront CDN
```

## Performance Optimization

### Frontend

```typescript
// Code splitting by route
const RandomChat = lazy(() => import('./pages/RandomChat'));
const VideoChat = lazy(() => import('./pages/VideoChat'));

// Image optimization
<img src={url} loading="lazy" alt="..." />

// Bundle size
pnpm build  // Check output size
```

### Backend

```typescript
// Database query optimization
- Use indexes on frequently queried columns
- Implement pagination for large result sets
- Cache user profiles in Redis

// Socket.IO optimization
- Use rooms for targeted broadcasts
- Implement message batching
- Enable compression
```

### Caching Strategy

```typescript
// Redis cache layers
- User profiles: 1 hour TTL
- Friend lists: 30 minutes TTL
- Online status: Real-time with 5-minute fallback
- Matching queue: No TTL (session-based)
```

## Security Hardening

### API Security

```typescript
// Rate limiting
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Helmet for security headers
app.use(helmet());
```

### Content Security

```typescript
// Input validation
import { z } from "zod";

const messageSchema = z.object({
  content: z.string().min(1).max(5000),
  recipientId: z.number().int().positive(),
});

// Profanity filtering + LLM moderation
const flaggedContent = await moderateContent(message);
if (flaggedContent.isToxic) {
  // Log for review, optionally suppress
}
```

### WebRTC Security

```typescript
// STUN/TURN servers for NAT traversal
iceServers: [
  { urls: ["stun:stun.l.google.com:19302"] },
  {
    urls: ["turn:your-turn-server.com"],
    username: "user",
    credential: "pass",
  },
];

// Require DTLS-SRTP for encryption
sdpTransform: "require-dtls-srtp";
```

## Monitoring & Alerting

### Key Metrics

```typescript
// Real-time monitoring
- Active users online
- Message throughput (msg/sec)
- Video call success rate
- API response times (p50, p95, p99)
- Error rates by endpoint
- Database connection pool usage
- Redis memory usage
```

### Logging

```typescript
// Structured logging
import winston from "winston";

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
  ],
});

// Log important events
logger.info("User matched", { userId1, userId2, duration });
logger.warn("Content flagged", { messageId, confidence });
logger.error("WebRTC connection failed", { error, userId });
```

### Error Tracking

```typescript
// Sentry integration
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

## Moderation Operations

### Reviewing Flagged Content

1. Navigate to Admin Dashboard → Moderation Queue
2. Review AI confidence scores
3. Approve or reject flagged messages
4. Take action on repeat offenders

### User Management

```typescript
// Suspend user (temporary)
await db.update(users).set({ isSuspended: true }).where(eq(users.id, userId));

// Ban user (permanent)
await db.update(users).set({ isBanned: true }).where(eq(users.id, userId));

// Clear user data
await db.delete(messages).where(eq(messages.senderId, userId));
await db
  .delete(chatSessions)
  .where(
    or(eq(chatSessions.user1Id, userId), eq(chatSessions.user2Id, userId))
  );
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# Kubernetes deployment example
apiVersion: apps/v1
kind: Deployment
metadata:
  name: connectnow
spec:
  replicas: 3
  selector:
    matchLabels:
      app: connectnow
  template:
    metadata:
      labels:
        app: connectnow
    spec:
      containers:
        - name: connectnow
          image: connectnow:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: connectnow-secrets
                  key: database-url
```

### Socket.IO Clustering

```typescript
// Use Redis adapter for multi-instance Socket.IO
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ host: "redis", port: 6379 });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Database Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_users_openid ON users(openId);
CREATE INDEX idx_messages_sender ON messages(senderId);
CREATE INDEX idx_messages_recipient ON messages(recipientId);
CREATE INDEX idx_chat_sessions_user1 ON chat_sessions(user1Id);
CREATE INDEX idx_chat_sessions_user2 ON chat_sessions(user2Id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_content_flags_reviewed ON content_flags(humanReviewed);
```

## Disaster Recovery

### Backup & Restore

```bash
# Backup database
mysqldump -u user -p connectnow > connectnow-backup.sql

# Restore from backup
mysql -u user -p connectnow < connectnow-backup.sql

# Backup Redis
redis-cli BGSAVE
# Copy /var/lib/redis/dump.rdb to safe location
```

### Failover Procedure

1. **Database Failover**
   - Promote read replica to primary
   - Update DATABASE_URL environment variable
   - Restart application servers

2. **Redis Failover**
   - Switch to Redis Sentinel or Cluster
   - Update REDIS_URL
   - Restart application servers

3. **Application Failover**
   - Load balancer automatically routes to healthy instances
   - Kubernetes automatically restarts failed pods

## Maintenance

### Regular Tasks

```bash
# Daily
- Monitor error rates and response times
- Review moderation queue
- Check disk space on backup storage

# Weekly
- Analyze user growth and engagement
- Review security logs
- Test backup restoration

# Monthly
- Performance optimization review
- Security audit
- Database maintenance (OPTIMIZE TABLE)
- Update dependencies (pnpm update)
```

### Planned Maintenance

```bash
# Maintenance window: Sunday 2:00 AM UTC
# 1. Notify users 24 hours in advance
# 2. Gracefully close WebSocket connections
# 3. Stop accepting new connections
# 4. Perform maintenance (DB migration, etc.)
# 5. Restart services
# 6. Verify all systems operational
```

## Troubleshooting

### Common Issues

**WebRTC Connection Fails**

- Check STUN/TURN server connectivity
- Verify firewall allows UDP ports
- Check browser console for errors
- Enable ICE candidate logging

**Socket.IO Disconnections**

- Check Redis connection
- Verify network stability
- Review Socket.IO logs
- Check for rate limiting

**High Database Load**

- Analyze slow query log
- Add missing indexes
- Implement query caching
- Consider read replicas

**Memory Leaks**

- Profile Node.js process: `node --inspect app.js`
- Check for unclosed database connections
- Review Socket.IO room cleanup
- Monitor Redis memory usage

## Support & Escalation

- **Technical Issues**: Check logs in `.manus-logs/`
- **Performance Issues**: Contact Manus support with metrics
- **Security Issues**: Report to security@connectnow.com
- **Billing/Account**: Use Manus Management UI

## Additional Resources

- [Manus Documentation](https://help.manus.im)
- [Socket.IO Documentation](https://socket.io/docs/)
- [WebRTC Best Practices](https://www.html5rocks.com/en/tutorials/webrtc/basics/)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Performance](https://react.dev/reference/react/useMemo)
