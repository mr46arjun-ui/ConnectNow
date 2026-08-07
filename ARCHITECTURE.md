# ConnectNow System Architecture

## High-Level Overview

ConnectNow is a real-time random video chat platform built with modern web technologies. The system is designed for scalability, reliability, and premium user experience.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React 19 + TypeScript + Tailwind CSS 4                  │   │
│  │  - Landing Page (Marketing)                              │   │
│  │  - Authentication (OAuth)                                │   │
│  │  - Dashboard (Navigation Hub)                            │   │
│  │  - Random Chat (Text + Matching)                         │   │
│  │  - Video Chat (WebRTC)                                   │   │
│  │  - Voice Chat (WebRTC Audio)                             │   │
│  │  - Friends & Messaging                                   │   │
│  │  - User Profile & Settings                               │   │
│  │  - Admin Dashboard                                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
│  Real-Time Communication:                                        │
│  - Socket.IO Client (Messaging, Presence)                       │
│  - WebRTC (Peer-to-Peer Media)                                  │
│  - tRPC Client (Type-Safe API Calls)                            │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  - Load Balancer (Nginx/Cloud LB)                               │
│  - SSL/TLS Termination                                          │
│  - Request Routing                                              │
│  - Rate Limiting                                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Node.js + Express + TypeScript                          │   │
│  │                                                          │   │
│  │  REST/tRPC Endpoints:                                    │   │
│  │  - Authentication & OAuth                               │   │
│  │  - User Management                                       │   │
│  │  - Profile Operations                                    │   │
│  │  - Friend System                                         │   │
│  │  - Messaging API                                         │   │
│  │  - Chat Sessions                                         │   │
│  │  - Reporting & Moderation                                │   │
│  │  - Admin Operations                                      │   │
│  │                                                          │   │
│  │  Real-Time Services:                                     │   │
│  │  - Socket.IO Server (Namespaces: /chat, /calls, /admin) │   │
│  │  - WebRTC Signaling Server                               │   │
│  │  - Presence Tracking                                     │   │
│  │  - Message Broadcasting                                  │   │
│  │                                                          │   │
│  │  Background Services:                                    │   │
│  │  - Content Moderation (LLM)                              │   │
│  │  - Profanity Filtering                                   │   │
│  │  - Notification Engine                                   │   │
│  │  - Queue Processing                                      │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                    ↓                ↓                ↓
        ┌───────────────┐  ┌──────────────┐  ┌──────────────┐
        │   Database    │  │    Cache     │  │   Storage    │
        │   (MySQL)     │  │   (Redis)    │  │   (S3)       │
        └───────────────┘  └──────────────┘  └──────────────┘
```

## Component Architecture

### Frontend Components

#### Pages
- **Home.tsx** - Landing page with feature showcase
- **Dashboard.tsx** - Main navigation hub after login
- **RandomChat.tsx** - Text-based random matching
- **VideoChat.tsx** - Video calling with WebRTC
- **VoiceChat.tsx** - Audio-only calling
- **Friends.tsx** - Friend list and requests
- **Messages.tsx** - Private messaging
- **Notifications.tsx** - Notification center
- **Profile.tsx** - User profile management
- **Settings.tsx** - User preferences
- **AdminDashboard.tsx** - Moderation tools

#### Shared Components
- **DashboardLayout.tsx** - Authenticated layout wrapper
- **ErrorBoundary.tsx** - Error handling
- **UI Components** - shadcn/ui library (50+ components)

#### Hooks & Utilities
- **useAuth()** - Authentication state management
- **useComposition()** - Text composition state
- **useMobile()** - Responsive design detection
- **trpc.*.useQuery/useMutation** - Data fetching

### Backend Services

#### Authentication Service
```typescript
// OAuth flow
1. User clicks "Sign In"
2. Redirect to Manus OAuth portal
3. Callback to /api/oauth/callback
4. Create/update user in database
5. Set JWT session cookie
6. Redirect to dashboard
```

#### Real-Time Engine (Socket.IO)
```typescript
// Namespaces
/chat        - Random chat matching & messaging
/calls       - Voice/video call signaling
/admin       - Admin notifications
/presence    - Online status tracking

// Key Events
- connection/disconnect
- user:online/offline
- match:found/rejected
- message:send/receive
- typing:start/stop
- call:initiate/accept/reject/end
- webrtc:offer/answer/ice-candidate
```

#### Matching Algorithm
```typescript
// Smart matching with filters
1. User joins queue with preferences
2. System finds compatible match:
   - Gender filter
   - Country filter
   - Language filter
   - Interest tags
   - Age range
3. Create chat session
4. Emit match:found event
5. Start message history
6. Enable skip/next
```

#### Moderation System
```typescript
// Two-tier moderation
1. Real-time filtering:
   - Profanity filter (regex-based)
   - LLM content analysis
   - Flag suspicious messages
   
2. Human review:
   - Admin dashboard queue
   - Review flagged content
   - Take action (warn/suspend/ban)
   - Log all moderation actions
```

#### WebRTC Signaling
```typescript
// SDP Exchange Flow
1. Caller initiates call
2. Create local offer (SDP)
3. Send offer via Socket.IO
4. Callee receives offer
5. Create local answer (SDP)
6. Send answer via Socket.IO
7. Exchange ICE candidates
8. Establish peer connection
9. Stream audio/video tracks
```

### Database Schema

#### Core Tables

**users**
```sql
id (PK)
openId (unique, OAuth identifier)
name
email
username
bio
avatar (S3 URL)
country
age
gender
interests (JSON array)
isVerified
isSuspended
isBanned
role (admin/user)
createdAt
updatedAt
lastSignedIn
```

**chat_sessions**
```sql
id (PK)
user1Id (FK → users)
user2Id (FK → users)
sessionType (text/video/voice)
startedAt
endedAt
duration
messageCount
```

**messages**
```sql
id (PK)
senderId (FK → users)
recipientId (FK → users)
chatSessionId (FK → chat_sessions)
content
contentType (text/emoji/file)
timestamp
isRead
readAt
```

**friend_requests**
```sql
id (PK)
senderId (FK → users)
receiverId (FK → users)
status (pending/accepted/rejected)
createdAt
respondedAt
```

**friends**
```sql
id (PK)
user1Id (FK → users)
user2Id (FK → users)
createdAt
```

**reports**
```sql
id (PK)
reporterId (FK → users)
reportedUserId (FK → users)
reason
description
chatSessionId (FK → chat_sessions, nullable)
status (pending/reviewed/actioned)
moderatorId (FK → users, nullable)
action (warning/suspend/ban)
createdAt
reviewedAt
```

**content_flags**
```sql
id (PK)
messageId (FK → messages)
flagReason
aiConfidence (0-1)
humanReviewed
moderatorId (FK → users, nullable)
action (approved/rejected)
createdAt
reviewedAt
```

**notifications**
```sql
id (PK)
userId (FK → users)
type (friend_request/message/system)
content
relatedUserId (FK → users, nullable)
isRead
createdAt
```

**blocked_users**
```sql
id (PK)
blockerId (FK → users)
blockedId (FK → users)
reason
createdAt
```

### Data Flow Examples

#### Random Chat Flow
```
1. User clicks "Start Random Chat"
2. Socket.IO emits: chat:join { preferences }
3. Server adds user to matching queue
4. Server finds compatible match
5. Socket.IO emits: match:found { user }
6. Both clients receive match notification
7. Chat session created in database
8. Message history loaded
9. Real-time messaging begins
```

#### Video Call Flow
```
1. User initiates video call
2. Socket.IO emits: call:initiate { recipientId }
3. Recipient receives call notification
4. Recipient clicks "Accept"
5. Socket.IO emits: call:accept
6. Caller creates WebRTC offer
7. Socket.IO sends offer via: webrtc:offer
8. Recipient creates answer
9. Socket.IO sends answer via: webrtc:answer
10. ICE candidates exchanged
11. Peer connection established
12. Audio/video streams flowing
```

#### Moderation Flow
```
1. User sends message
2. Server applies profanity filter
3. If flagged, send to LLM for analysis
4. LLM returns confidence score
5. If confidence > threshold:
   - Create content_flag record
   - Message delivered but marked
   - Add to admin review queue
6. Admin reviews in dashboard
7. Admin approves/rejects
8. Action logged in moderation_logs
```

## Scalability Architecture

### Horizontal Scaling

**Load Balancing**
- Nginx or cloud load balancer
- Round-robin distribution
- Health checks every 10 seconds
- Sticky sessions for WebSocket

**Application Servers**
- Multiple Node.js instances
- Stateless design (no local state)
- Shared Redis for sessions
- Shared database connection pool

**Database Scaling**
- Primary-replica setup
- Read replicas for analytics
- Connection pooling (20-50 connections)
- Query optimization with indexes

**Redis Scaling**
- Redis Cluster for high availability
- Sentinel for failover
- AOF persistence enabled
- Memory limits with eviction policy

### Caching Strategy

```typescript
// Cache Layers
L1: Browser Cache (Service Worker)
    - Static assets: 1 year
    - API responses: 5 minutes

L2: CDN Cache (CloudFront/Cloudflare)
    - Images: 1 month
    - JS/CSS: 1 year
    - API: 1 minute

L3: Redis Cache
    - User profiles: 1 hour
    - Friend lists: 30 minutes
    - Online status: Real-time
    - Message history: 24 hours

L4: Database Query Cache
    - Prepared statements
    - Query result caching
    - Index optimization
```

### Performance Metrics

**Frontend**
- Lighthouse Score: 90+
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Bundle Size: < 200KB (gzipped)

**Backend**
- API Response Time (p95): < 100ms
- Socket.IO Message Latency: < 50ms
- WebRTC Connection Time: < 2s
- Database Query Time (p95): < 50ms

**Infrastructure**
- Uptime: 99.9%
- Error Rate: < 0.1%
- Concurrent Users: 10,000+
- Messages/Second: 50,000+

## Security Architecture

### Authentication & Authorization

```typescript
// OAuth Flow
1. User initiates login
2. Redirect to Manus OAuth
3. User grants permissions
4. Receive authorization code
5. Exchange code for access token
6. Create user in database
7. Generate JWT session token
8. Set secure HTTP-only cookie
9. Redirect to dashboard

// JWT Token
- Issued: On login
- Expiry: 7 days
- Refresh: Via /api/auth/refresh
- Stored: HTTP-only cookie
- Signed: HS256 with JWT_SECRET
```

### Data Protection

```typescript
// Encryption
- In Transit: TLS 1.3
- At Rest: Database encryption
- Sensitive Fields: Hashed (passwords)
- User Files: Encrypted in S3

// Access Control
- protectedProcedure: Authenticated users
- adminProcedure: Admin users only
- Row-level security: Users see own data
- Rate limiting: 100 req/15min per IP
```

### Content Security

```typescript
// Input Validation
- Zod schemas on all inputs
- Type checking at compile time
- Runtime validation on API
- Sanitization of HTML/JS

// Output Encoding
- XSS prevention via React
- CSRF tokens on state-changing ops
- Content Security Policy headers
- Subresource Integrity for CDN
```

## Monitoring & Observability

### Metrics Collection

```typescript
// Application Metrics
- Request count by endpoint
- Response time distribution
- Error rate by type
- Active WebSocket connections
- Message throughput
- Call success rate

// Infrastructure Metrics
- CPU usage
- Memory usage
- Disk I/O
- Network bandwidth
- Database connections
- Redis memory usage

// Business Metrics
- Daily active users
- New user signups
- Message volume
- Call duration
- User retention
```

### Logging Strategy

```typescript
// Log Levels
- ERROR: System failures, exceptions
- WARN: Deprecated usage, edge cases
- INFO: Important business events
- DEBUG: Detailed execution flow

// Log Format
{
  timestamp: ISO8601,
  level: string,
  service: string,
  userId?: number,
  requestId: string,
  message: string,
  metadata: object,
  error?: object
}

// Log Retention
- ERROR logs: 90 days
- WARN logs: 30 days
- INFO logs: 7 days
- DEBUG logs: 1 day
```

### Alerting Rules

```
- Error rate > 1% → Page on-call
- Response time p95 > 500ms → Alert
- Database connections > 80% → Alert
- Redis memory > 80% → Alert
- Uptime < 99.5% → Alert
- Failed deployments → Alert
```

## Deployment Pipeline

### CI/CD Flow

```
1. Developer pushes to main
2. GitHub Actions triggered
3. Run tests (unit + integration)
4. Build Docker image
5. Push to container registry
6. Deploy to staging
7. Run smoke tests
8. Manual approval
9. Deploy to production
10. Monitor for errors
11. Rollback if needed
```

### Deployment Checklist

```
- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] Bundle size check
- [ ] Database migrations ready
- [ ] Environment variables set
- [ ] Backup created
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] Stakeholders notified
- [ ] Post-deployment verification
```

## Disaster Recovery

### Backup Strategy

```
- Database: Daily full backup + hourly incremental
- Redis: Continuous AOF + daily snapshots
- Files: Continuous replication to secondary S3
- Configs: Version controlled in Git

Recovery Time Objective (RTO): 1 hour
Recovery Point Objective (RPO): 15 minutes
```

### Failover Procedures

```
1. Database Failover
   - Promote read replica
   - Update connection string
   - Restart app servers

2. Redis Failover
   - Sentinel promotes replica
   - Automatic reconnection
   - No manual intervention

3. Application Failover
   - Load balancer routes to healthy
   - Kubernetes auto-restarts pods
   - No user-visible downtime
```

## Future Enhancements

- [ ] Mediasoup SFU for group video
- [ ] End-to-end encryption for messages
- [ ] Machine learning for better matching
- [ ] Video recording and playback
- [ ] Live streaming capabilities
- [ ] Mobile native apps (React Native)
- [ ] Blockchain for reputation system
- [ ] AI-powered translation
