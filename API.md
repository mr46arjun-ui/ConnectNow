# ConnectNow API Documentation

## Overview

ConnectNow uses tRPC for type-safe API calls. All procedures are accessible via the `/api/trpc` endpoint.

## Authentication

All protected procedures require a valid JWT token in the session cookie. Public procedures don't require authentication.

## Base URL

- Development: `http://localhost:3000/api/trpc`
- Production: `https://connectnow.app/api/trpc`

## Routers

### Auth Router

#### `auth.me`
Get current user information.

**Type**: Query (Public)

**Response**:
```typescript
{
  id: number;
  email: string;
  username: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
}
```

#### `auth.logout`
Logout current user.

**Type**: Mutation (Public)

**Response**:
```typescript
{ success: boolean }
```

#### `auth.updateProfile`
Update user profile.

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  username?: string;
  bio?: string;
  country?: string;
  age?: number;
}
```

**Response**:
```typescript
{
  id: number;
  username: string;
  bio?: string;
  country?: string;
  age?: number;
}
```

#### `auth.forgotPassword`
Request password reset.

**Type**: Mutation (Public)

**Input**:
```typescript
{ email: string }
```

**Response**:
```typescript
{ success: boolean; message: string }
```

#### `auth.resetPassword`
Reset password with token.

**Type**: Mutation (Public)

**Input**:
```typescript
{
  token: string;
  newPassword: string;
}
```

**Response**:
```typescript
{ success: boolean; message: string }
```

### Friends Router

#### `friends.sendRequest`
Send friend request.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ receiverId: number }
```

**Response**:
```typescript
{ id: number; status: 'pending' }
```

#### `friends.acceptRequest`
Accept friend request.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ requestId: number }
```

**Response**:
```typescript
{ success: boolean }
```

#### `friends.rejectRequest`
Reject friend request.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ requestId: number }
```

**Response**:
```typescript
{ success: boolean }
```

#### `friends.getFriendsList`
Get list of friends.

**Type**: Query (Protected)

**Response**:
```typescript
Array<{
  id: number;
  name: string;
  username: string;
  avatar?: string;
  status: 'online' | 'offline';
}>
```

#### `friends.removeFriend`
Remove friend.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ friendId: number }
```

**Response**:
```typescript
{ success: boolean }
```

### Messages Router

#### `messages.send`
Send private message.

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  recipientId: number;
  content: string;
}
```

**Response**:
```typescript
{
  id: number;
  senderId: number;
  recipientId: number;
  content: string;
  timestamp: Date;
  isRead: boolean;
}
```

#### `messages.getConversation`
Get conversation history.

**Type**: Query (Protected)

**Input**:
```typescript
{
  userId: number;
  limit?: number;
}
```

**Response**:
```typescript
Array<{
  id: number;
  senderId: number;
  senderName: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}>
```

#### `messages.markAsRead`
Mark messages as read.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ messageIds: number[] }
```

**Response**:
```typescript
{ success: boolean }
```

#### `messages.delete`
Delete message.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ messageId: number }
```

**Response**:
```typescript
{ success: boolean }
```

#### `messages.edit`
Edit message.

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  messageId: number;
  content: string;
}
```

**Response**:
```typescript
{
  id: number;
  content: string;
  updatedAt: Date;
}
```

#### `messages.addReaction`
Add emoji reaction to message.

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  messageId: number;
  emoji: string;
}
```

**Response**:
```typescript
{ success: boolean }
```

#### `messages.removeReaction`
Remove emoji reaction from message.

**Type**: Mutation (Protected)

**Input**:
```typescript
{
  messageId: number;
  emoji: string;
}
```

**Response**:
```typescript
{ success: boolean }
```

### Notifications Router

#### `notifications.getNotifications`
Get user notifications.

**Type**: Query (Protected)

**Input**:
```typescript
{ limit?: number }
```

**Response**:
```typescript
Array<{
  id: number;
  type: string;
  content: string;
  read: boolean;
  createdAt: Date;
}>
```

#### `notifications.markAsRead`
Mark notification as read.

**Type**: Mutation (Protected)

**Input**:
```typescript
{ notificationId: number }
```

**Response**:
```typescript
{ success: boolean }
```

### Admin Router

#### `admin.getUsers`
Get list of users (admin only).

**Type**: Query (Admin)

**Input**:
```typescript
{
  page?: number;
  limit?: number;
  search?: string;
}
```

**Response**:
```typescript
{
  users: Array<{
    id: number;
    username: string;
    email: string;
    status: 'active' | 'suspended' | 'banned';
    createdAt: Date;
  }>;
  total: number;
}
```

#### `admin.suspendUser`
Suspend user (admin only).

**Type**: Mutation (Admin)

**Input**:
```typescript
{
  userId: number;
  reason: string;
}
```

**Response**:
```typescript
{ success: boolean }
```

#### `admin.banUser`
Ban user (admin only).

**Type**: Mutation (Admin)

**Input**:
```typescript
{
  userId: number;
  reason: string;
}
```

**Response**:
```typescript
{ success: boolean }
```

#### `admin.getAnalytics`
Get platform analytics (admin only).

**Type**: Query (Admin)

**Input**:
```typescript
{
  period: 'day' | 'week' | 'month';
}
```

**Response**:
```typescript
{
  messageVolume: number;
  activeUsers: number;
  newUsers: number;
  avgSessionDuration: number;
}
```

#### `admin.getHealthMetrics`
Get system health metrics (admin only).

**Type**: Query (Admin)

**Response**:
```typescript
{
  onlineUsers: number;
  totalUsers: number;
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
}
```

## Error Handling

All errors follow the tRPC error format:

```typescript
{
  code: 'UNAUTHORIZED' | 'NOT_FOUND' | 'BAD_REQUEST' | 'INTERNAL_SERVER_ERROR' | ...;
  message: string;
}
```

Common error codes:
- `UNAUTHORIZED`: User not authenticated
- `FORBIDDEN`: User lacks permissions
- `NOT_FOUND`: Resource not found
- `BAD_REQUEST`: Invalid input
- `INTERNAL_SERVER_ERROR`: Server error
- `CONFLICT`: Resource already exists
- `TOO_MANY_REQUESTS`: Rate limit exceeded

## Rate Limiting

- Auth endpoints: 5 requests/minute per IP
- API endpoints: 100 requests/minute per user
- WebSocket: 1000 messages/hour per user

## WebSocket Events

### Socket.IO Namespace: `/`

#### `private-message:send`
Send private message via WebSocket.

**Emit**:
```typescript
{
  receiverId: number;
  content: string;
}
```

#### `private-message:received`
Receive private message.

**Listen**:
```typescript
{
  senderId: number;
  senderName: string;
  content: string;
  timestamp: Date;
}
```

#### `user:online`
User came online.

**Listen**:
```typescript
{
  userId: number;
  username: string;
}
```

#### `user:offline`
User went offline.

**Listen**:
```typescript
{
  userId: number;
}
```

#### `typing:start`
User started typing.

**Emit**:
```typescript
{
  recipientId: number;
}
```

**Listen**:
```typescript
{
  userId: number;
}
```

#### `typing:stop`
User stopped typing.

**Emit**:
```typescript
{
  recipientId: number;
}
```

**Listen**:
```typescript
{
  userId: number;
}
```

## Usage Examples

### JavaScript/TypeScript

```typescript
import { trpc } from '@/lib/trpc';

// Get current user
const user = await trpc.auth.me.useQuery();

// Send message
await trpc.messages.send.useMutation({
  recipientId: 123,
  content: 'Hello!',
});

// Get friends list
const friends = await trpc.friends.getFriendsList.useQuery();
```

### cURL

```bash
# Get current user
curl -X POST http://localhost:3000/api/trpc/auth.me

# Send message
curl -X POST http://localhost:3000/api/trpc/messages.send \
  -H "Content-Type: application/json" \
  -d '{
    "recipientId": 123,
    "content": "Hello!"
  }'
```

## Pagination

Endpoints that support pagination use:
- `page`: Page number (1-indexed)
- `limit`: Items per page (default: 20, max: 100)

Response includes:
```typescript
{
  items: Array<T>;
  total: number;
  page: number;
  limit: number;
}
```

## Versioning

Current API version: v1

Breaking changes will increment the major version number.

## Support

For API issues, check:
1. Authentication token is valid
2. Input parameters match schema
3. User has required permissions
4. Rate limits not exceeded
5. Server logs for errors
