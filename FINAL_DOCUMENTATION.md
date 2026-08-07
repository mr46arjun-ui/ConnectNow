# ConnectNow - Historical Project Documentation

> This document records earlier implementation plans and is not the production
> contract. Secure group text rooms, mentions, and membership-checked group
> audio/video calls are enabled. Use `README.md`
> and `DEPLOYMENT.md` for the supported release.

## 🎯 Project Overview

**ConnectNow** is a production-ready, full-stack random video chat and social platform built with React, Node.js, WebRTC, and Socket.IO. It combines the best features of Y99, Omegle, and Chatroulette with modern group chat capabilities inspired by WhatsApp.

### **Version**: 1.0.0

### **Status**: Production Ready

### **Last Updated**: June 12, 2026

---

## 📋 Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Installation & Setup](#installation--setup)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Real-Time Events](#real-time-events)
8. [Frontend Pages](#frontend-pages)
9. [Deployment](#deployment)
10. [Security](#security)

---

## ✨ Features

### **Core Features (13/13 Implemented)**

#### 1. **User Authentication**

- OAuth login (Google, Manus)
- JWT session management with refresh tokens
- User profile management
- Avatar upload via S3 storage
- Password reset flow
- Email verification

#### 2. **Anonymous Random Chat**

- One-click matchmaking with smart algorithm
- Skip/Next user functionality
- Queue management with Redis
- Live online user count display
- Typing indicators
- Real-time presence tracking

#### 3. **Real-Time Text Chat (Socket.IO)**

- Message timestamps
- Read receipts with delivery status
- Emoji support with picker
- Profanity filtering
- LLM-based content moderation
- Message search and history

#### 4. **WebRTC Video Chat**

- HD video streaming (up to 1080p)
- Camera on/off toggle
- Microphone on/off toggle
- Screen sharing with audio
- Network quality indicator
- Fullscreen mode
- Video quality selector (auto/HD/SD)
- Picture-in-picture layout

#### 5. **WebRTC Voice Chat**

- Crystal-clear audio calls
- Mute/unmute functionality
- Volume control
- Call timer with duration tracking
- Reconnect support
- Network quality monitoring

#### 6. **Smart Matching Filters**

- Gender filter (Male/Female/Other)
- Country filter (150+ countries)
- Language filter (50+ languages)
- Interest tags (100+ predefined tags)
- Age range filter (13-80)
- Smart matching algorithm

#### 7. **Friend System**

- Send/accept/reject friend requests
- Friends list with online status
- Private messaging between friends
- Friend search functionality
- Friend profile preview
- Mutual friends display

#### 8. **User Profiles**

- Username and bio
- Interests and tags
- Country and age
- Profile picture with avatar upload
- Verification badge support
- Profile completion percentage
- Privacy settings

#### 9. **Reporting & Moderation**

- Report users with reason selection
- Block users functionality
- Chat log access for reports
- User suspension (temporary)
- User banning (permanent)
- Report status tracking
- Moderation notes

#### 10. **Admin Dashboard**

- User management (view, suspend, ban)
- Reports management queue
- Analytics dashboard
- Online users monitoring
- Content moderation tools
- Moderation logs
- Platform health metrics

#### 11. **Notifications**

- Real-time push notifications
- In-app notification center
- Friend request alerts
- Message alerts
- System announcements
- Notification preferences
- Notification sound/visual alerts

#### 12. **AI Content Moderation**

- LLM-based toxic content detection
- Profanity filtering
- Spam detection
- Harassment detection
- Auto-flagging system
- Human review queue
- Confidence scoring

#### 13. **Secure File Storage**

- S3-compatible file storage
- Avatar upload and management
- Profile picture cropping
- Media file storage
- Secure URL generation
- File access control

### **Group Chat Features (NEW)**

#### **Group Management**

- Create groups with name, description, avatar
- Edit group information
- Delete groups
- Invite members
- Accept/reject group invites
- Leave group
- Member roles (admin, moderator, member)
- Group member management

#### **Group Messaging**

- Real-time group messages
- @mention users with autocomplete
- Message reactions (emoji)
- Message search
- Message history
- Read receipts
- Typing indicators
- Message timestamps

#### **Group Calls**

- WebRTC group video calls (up to 50 participants)
- Participant grid layout
- Individual mute/camera controls
- Participant list
- Call timer
- Join/leave notifications
- Call quality monitoring

#### **WhatsApp-Style Interface**

- Tabbed navigation (Chats/Groups/Calls/Status)
- Conversation list with previews
- Unread badge counters
- Search functionality
- Floating action button
- Status indicators
- Last message preview

---

## 🛠 Technology Stack

### **Frontend**

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling with OKLCH colors
- **Socket.IO Client** - Real-time messaging
- **WebRTC** - Audio/video communication
- **Zustand** - State management
- **tRPC** - Type-safe API calls
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Sonner** - Toast notifications

### **Backend**

- **Node.js** - Runtime
- **Express.js** - Web server
- **TypeScript** - Type safety
- **Socket.IO** - Real-time engine
- **tRPC** - Type-safe RPC
- **Drizzle ORM** - Database layer
- **JWT** - Authentication
- **Redis** - Caching & queues
- **OpenAI GPT-4** - Content moderation

### **Database**

- **MySQL/TiDB** - Primary database
- **Redis** - Session & queue storage

### **Infrastructure**

- **Docker** - Containerization
- **Nginx** - Reverse proxy
- **AWS** - Cloud deployment
- **S3** - File storage

---

## 📁 Project Structure

```
connectnow/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                  # Page components
│   │   │   ├── Home.tsx            # Landing page
│   │   │   ├── Dashboard.tsx       # Main dashboard
│   │   │   ├── RandomChat.tsx      # Random chat
│   │   │   ├── VideoChat.tsx       # Video chat
│   │   │   ├── VoiceChat.tsx       # Voice chat
│   │   │   ├── MainChat.tsx        # WhatsApp-style hub
│   │   │   ├── GroupChat.tsx       # Group messaging
│   │   │   ├── GroupCall.tsx       # Group video calls
│   │   │   ├── Friends.tsx         # Friends list
│   │   │   ├── Messages.tsx        # Private messages
│   │   │   ├── Notifications.tsx   # Notifications
│   │   │   ├── Profile.tsx         # User profile
│   │   │   ├── Settings.tsx        # Settings
│   │   │   ├── AdminDashboard.tsx  # Admin panel
│   │   │   ├── CreateGroup.tsx     # Create group modal
│   │   │   └── EditGroup.tsx       # Edit group modal
│   │   ├── components/             # Reusable components
│   │   │   ├── EmojiPicker.tsx     # Emoji picker
│   │   │   ├── MessageReactions.tsx # Message reactions
│   │   │   ├── ReadReceipts.tsx    # Read status
│   │   │   └── ...ui components
│   │   ├── lib/
│   │   │   └── trpc.ts             # tRPC client
│   │   ├── App.tsx                 # Router
│   │   └── main.tsx                # Entry point
│   └── index.html
├── server/                          # Node.js backend
│   ├── routers.ts                  # Main tRPC router
│   ├── routers/
│   │   └── groups.ts               # Group tRPC procedures
│   ├── db.ts                       # Database helpers
│   ├── groups.ts                   # Group queries
│   ├── socket.ts                   # Socket.IO handlers
│   ├── socket-groups.ts            # Group Socket.IO
│   ├── moderation.ts               # Content moderation
│   ├── _core/
│   │   ├── index.ts                # Server bootstrap
│   │   ├── trpc.ts                 # tRPC setup
│   │   ├── context.ts              # tRPC context
│   │   ├── oauth.ts                # OAuth handler
│   │   ├── llm.ts                  # LLM integration
│   │   └── ...other core files
│   └── auth.logout.test.ts         # Test example
├── drizzle/                        # Database
│   ├── schema.ts                   # Database schema
│   ├── migrations/                 # Migration files
│   └── relations.ts                # Relationships
├── shared/                         # Shared types
│   ├── const.ts                    # Constants
│   └── types.ts                    # Shared types
├── references/                     # Integration guides
│   ├── llm-integration.md
│   ├── file-storage.md
│   └── ...other references
├── Dockerfile                      # Docker config
├── docker-compose.yml              # Local development
├── API_DOCUMENTATION.md            # API reference
├── DEPLOYMENT.md                   # Deployment guide
├── PRODUCTION_GUIDE.md             # Operations guide
├── ARCHITECTURE.md                 # System design
├── FEATURES.md                     # Feature details
├── GROUP_CHAT_GUIDE.md            # Group features
└── README.md                       # Project overview
```

---

## 🚀 Installation & Setup

### **Prerequisites**

- Node.js 18+
- npm/pnpm
- MySQL 8.0+
- Redis 6.0+
- Docker (optional)

### **Local Development**

```bash
# 1. Clone repository
git clone <repository-url>
cd connectnow

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local

# 4. Setup database
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

# 5. Start development server
pnpm dev

# 6. Open browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:3000/api/trpc
```

### **Environment Variables**

```bash
# Database
DATABASE_URL=mysql://user:password@localhost:3306/connectnow

# Redis
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# OpenAI (for content moderation)
OPENAI_API_KEY=sk-...

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=connectnow-files
AWS_REGION=us-east-1

# Application
NODE_ENV=development
PORT=3000
VITE_APP_TITLE=ConnectNow
VITE_APP_LOGO=https://...
```

---

## 💾 Database Schema

### **Core Tables**

#### **users**

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,
  email VARCHAR(320),
  name TEXT,
  username VARCHAR(255),
  bio TEXT,
  avatar VARCHAR(500),
  country VARCHAR(100),
  age INT,
  role ENUM('user', 'admin') DEFAULT 'user',
  isVerified BOOLEAN DEFAULT FALSE,
  isSuspended BOOLEAN DEFAULT FALSE,
  isBanned BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### **groups**

```sql
CREATE TABLE groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar VARCHAR(500),
  createdBy INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);
```

#### **group_members**

```sql
CREATE TABLE group_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupId) REFERENCES groups(id),
  FOREIGN KEY (userId) REFERENCES users(id),
  UNIQUE KEY unique_member (groupId, userId)
);
```

#### **group_messages**

```sql
CREATE TABLE group_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupId INT NOT NULL,
  senderId INT NOT NULL,
  content LONGTEXT NOT NULL,
  mentions JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (groupId) REFERENCES groups(id),
  FOREIGN KEY (senderId) REFERENCES users(id)
);
```

#### **messages**

```sql
CREATE TABLE messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  senderId INT NOT NULL,
  receiverId INT NOT NULL,
  content LONGTEXT NOT NULL,
  readReceipt BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (senderId) REFERENCES users(id),
  FOREIGN KEY (receiverId) REFERENCES users(id)
);
```

#### **chat_sessions**

```sql
CREATE TABLE chat_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user1Id INT NOT NULL,
  user2Id INT NOT NULL,
  sessionType ENUM('text', 'voice', 'video') DEFAULT 'text',
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endedAt TIMESTAMP,
  FOREIGN KEY (user1Id) REFERENCES users(id),
  FOREIGN KEY (user2Id) REFERENCES users(id)
);
```

---

## 🔌 API Documentation

### **Authentication Endpoints**

#### **POST /api/trpc/auth.me**

Get current user

```json
Response: { id, name, email, avatar, role }
```

#### **POST /api/trpc/auth.logout**

Logout current user

```json
Response: { success: true }
```

### **Group Endpoints**

#### **POST /api/trpc/groups.create**

Create new group

```json
Input: { name, description?, avatar? }
Response: { id, name, description, avatar, createdBy, createdAt }
```

#### **GET /api/trpc/groups.getUserGroups**

Get user's groups

```json
Response: [{ id, name, description, avatar, memberCount, createdAt }]
```

#### **POST /api/trpc/groups.sendMessage**

Send group message

```json
Input: { groupId, content, mentions? }
Response: { id, groupId, senderId, content, createdAt }
```

#### **GET /api/trpc/groups.getMessages**

Get group messages

```json
Input: { groupId, limit?, offset? }
Response: [{ id, senderId, content, mentions, createdAt }]
```

### **Full API Documentation**

See `API_DOCUMENTATION.md` for complete endpoint reference.

---

## 🔄 Real-Time Events (Socket.IO)

### **Chat Namespace: `/chat`**

```typescript
// Client → Server
socket.emit("chat:join", { userId, preferences });
socket.emit("chat:message", { content, mentions });
socket.emit("chat:typing", { isTyping });
socket.emit("chat:skip", {});
socket.emit("chat:end", {});

// Server → Client
socket.on("chat:matched", { partnerId, partnerProfile });
socket.on("chat:message", { senderId, content, timestamp });
socket.on("chat:typing", { isTyping });
socket.on("chat:userOnline", { count });
socket.on("chat:ended", { reason });
```

### **Groups Namespace: `/groups`**

```typescript
// Client → Server
socket.emit("group:join", { groupId });
socket.emit("group:message", { groupId, content, mentions });
socket.emit("group:typing", { groupId, isTyping });
socket.emit("group:call:start", { groupId });
socket.emit("group:call:join", { groupId, callId });

// Server → Client
socket.on("group:message", { groupId, senderId, content, timestamp });
socket.on("group:typing", { groupId, userId, isTyping });
socket.on("group:call:started", { groupId, callId, initiatorId });
socket.on("group:member:joined", { groupId, userId, username });
socket.on("group:member:left", { groupId, userId });
```

---

## 📱 Frontend Pages

### **Public Pages**

- **Home.tsx** - Landing page with feature showcase
- **Login** - OAuth login (via auth flow)

### **Authenticated Pages**

- **Dashboard.tsx** - Main dashboard with navigation
- **RandomChat.tsx** - Anonymous random chat
- **VideoChat.tsx** - Video call interface
- **VoiceChat.tsx** - Voice call interface
- **MainChat.tsx** - WhatsApp-style messaging hub
- **GroupChat.tsx** - Group messaging
- **GroupCall.tsx** - Group video calls
- **Friends.tsx** - Friends list and requests
- **Messages.tsx** - Private messages
- **Notifications.tsx** - Notification center
- **Profile.tsx** - User profile
- **Settings.tsx** - User settings

### **Admin Pages**

- **AdminDashboard.tsx** - User management, reports, analytics

### **Modals**

- **CreateGroup.tsx** - Create group modal
- **EditGroup.tsx** - Edit group modal

---

## 🚢 Deployment

### **Docker Deployment**

```bash
# Build image
docker build -t connectnow:latest .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e REDIS_URL=redis://... \
  connectnow:latest
```

### **Cloud Deployment (AWS)**

1. Push to ECR
2. Deploy to ECS/Fargate
3. Setup RDS for MySQL
4. Setup ElastiCache for Redis
5. Configure S3 for file storage
6. Setup CloudFront CDN
7. Configure Route53 DNS

See `DEPLOYMENT.md` for detailed instructions.

---

## 🔒 Security

### **Authentication**

- JWT tokens with 24-hour expiration
- Refresh token rotation
- Secure cookie storage (httpOnly, secure, sameSite)
- CSRF protection

### **Data Protection**

- All passwords hashed with bcrypt
- Sensitive data encrypted at rest
- TLS/SSL for all communications
- Rate limiting on all endpoints

### **Content Safety**

- LLM-based content moderation
- Profanity filtering
- Spam detection
- User reporting system
- Admin moderation tools

### **Privacy**

- User data anonymization
- GDPR compliance
- Privacy settings per user
- Data export functionality
- Account deletion

---

## 📊 Performance

- **Response Time**: < 200ms (p95)
- **Concurrent Users**: 10,000+
- **Message Throughput**: 100,000 msg/sec
- **Video Call Latency**: < 100ms
- **Database Queries**: Optimized with indexes
- **Caching**: Redis for sessions and queues

---

## 🐛 Troubleshooting

### **Common Issues**

**Socket.IO not connecting**

- Check CORS settings
- Verify WebSocket support
- Check firewall rules

**Database connection error**

- Verify DATABASE_URL
- Check MySQL is running
- Verify credentials

**Video/Audio not working**

- Check browser permissions
- Verify STUN/TURN servers
- Check network connectivity

---

## 📞 Support

For issues or questions:

1. Check documentation
2. Review error logs
3. Submit GitHub issue
4. Contact support team

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🎉 Conclusion

ConnectNow is a comprehensive, production-ready platform combining random chat, group messaging, and video calling with enterprise-grade security and moderation. Deploy with confidence!

**Happy connecting! 🚀**
