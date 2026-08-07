# ConnectNow API Documentation

## Overview

ConnectNow uses a hybrid architecture combining tRPC for type-safe RPC calls and Socket.IO for real-time communication. All authentication is handled via Manus OAuth with JWT session management.

## Authentication

### OAuth Flow
1. User clicks "Sign In" button
2. Redirected to Manus OAuth portal
3. After authentication, callback to `/api/oauth/callback`
4. Session cookie set with JWT token
5. User can access protected procedures

### Protected Procedures
All procedures marked as `protectedProcedure` require a valid session cookie. If not authenticated, they return a 401 error.

## tRPC Routers

### Auth Router (`auth.*`)

#### `auth.me`
- **Type**: Query
- **Auth**: Public
- **Returns**: Current user object or null
- **Usage**: Check if user is logged in

#### `auth.logout`
- **Type**: Mutation
- **Auth**: Public
- **Returns**: `{ success: true }`
- **Usage**: Clear session cookie and logout

#### `auth.updateProfile`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ username?, bio?, country?, age? }`
- **Returns**: Updated user object
- **Usage**: Update user profile information

#### `auth.getProfile`
- **Type**: Query
- **Auth**: Protected
- **Input**: `{ userId: number }`
- **Returns**: User profile object
- **Usage**: Get another user's profile

### Profile Router (`profile.*`)

#### `profile.getProfile`
- **Type**: Query
- **Auth**: Protected
- **Input**: `{ userId: number }`
- **Returns**: User profile with interests
- **Usage**: Get user profile with extended info

#### `profile.updateProfile`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ interests?, languages? }`
- **Returns**: Updated profile
- **Usage**: Update interests and languages

#### `profile.getInterests`
- **Type**: Query
- **Auth**: Public
- **Returns**: Array of available interests
- **Usage**: Get list of interest categories

### Matching Router (`matching.*`)

#### `matching.getPreferences`
- **Type**: Query
- **Auth**: Protected
- **Returns**: Matching preferences object
- **Usage**: Get current matching filters

#### `matching.updatePreferences`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ genderFilter?, countryFilter?, languageFilter?, ageMin?, ageMax?, interestTags? }`
- **Returns**: Updated preferences
- **Usage**: Update matching filters

#### `matching.findMatch`
- **Type**: Query
- **Auth**: Protected
- **Returns**: `{ status: "waiting", message: string }`
- **Usage**: Get current matching status (real matching via Socket.IO)

### Friends Router (`friends.*`)

#### `friends.sendRequest`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ receiverId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Send friend request

#### `friends.acceptRequest`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ requestId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Accept friend request

#### `friends.rejectRequest`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ requestId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Reject friend request

#### `friends.getFriendsList`
- **Type**: Query
- **Auth**: Protected
- **Returns**: Array of friend objects
- **Usage**: Get list of friends

#### `friends.getFriendRequests`
- **Type**: Query
- **Auth**: Protected
- **Returns**: Array of pending friend requests
- **Usage**: Get incoming friend requests

#### `friends.removeFriend`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ friendId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Remove friend

### Blocks Router (`blocks.*`)

#### `blocks.blockUser`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ userId: number, reason?: string }`
- **Returns**: `{ success: true }`
- **Usage**: Block a user

#### `blocks.unblockUser`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ userId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Unblock a user

#### `blocks.getBlockedUsers`
- **Type**: Query
- **Auth**: Protected
- **Returns**: Array of blocked user objects
- **Usage**: Get list of blocked users

#### `blocks.isBlocked`
- **Type**: Query
- **Auth**: Protected
- **Input**: `{ userId: number }`
- **Returns**: Boolean
- **Usage**: Check if a user is blocked

### Messages Router (`messages.*`)

#### `messages.getSessionMessages`
- **Type**: Query
- **Auth**: Protected
- **Input**: `{ sessionId: number, limit?: number }`
- **Returns**: Array of message objects
- **Usage**: Get messages from a chat session

#### `messages.markAsRead`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ messageId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Mark message as read

#### `messages.getPrivateMessages`
- **Type**: Query
- **Auth**: Protected
- **Input**: `{ friendId: number, limit?: number }`
- **Returns**: Array of private message objects
- **Usage**: Get private messages with a friend

#### `messages.markPrivateAsRead`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ messageId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Mark private message as read

### Notifications Router (`notifications.*`)

#### `notifications.getNotifications`
- **Type**: Query
- **Auth**: Protected
- **Input**: `{ limit?: number }`
- **Returns**: Array of notification objects
- **Usage**: Get user notifications

#### `notifications.markAsRead`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ notificationId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Mark notification as read

#### `notifications.getUnreadCount`
- **Type**: Query
- **Auth**: Protected
- **Returns**: Number of unread notifications
- **Usage**: Get unread notification count

### Reports Router (`reports.*`)

#### `reports.reportUser`
- **Type**: Mutation
- **Auth**: Protected
- **Input**: `{ reportedUserId: number, reason: "harassment"|"inappropriate_content"|"spam"|"impersonation"|"other", description?: string, sessionId?: number }`
- **Returns**: `{ success: true }`
- **Usage**: Report a user

#### `reports.getReports`
- **Type**: Query
- **Auth**: Protected (admin only)
- **Returns**: Array of pending reports
- **Usage**: Get reports for moderation

#### `reports.updateReport`
- **Type**: Mutation
- **Auth**: Protected (admin only)
- **Input**: `{ reportId: number, status?, action?, moderationNotes? }`
- **Returns**: `{ success: true }`
- **Usage**: Update report status and take action

### Admin Router (`admin.*`)

#### `admin.getStats`
- **Type**: Query
- **Auth**: Protected (admin only)
- **Returns**: `{ onlineCount: number, timestamp: Date }`
- **Usage**: Get platform statistics

#### `admin.getOnlineUsers`
- **Type**: Query
- **Auth**: Protected (admin only)
- **Returns**: Array of online user objects
- **Usage**: Get list of online users

#### `admin.suspendUser`
- **Type**: Mutation
- **Auth**: Protected (admin only)
- **Input**: `{ userId: number, reason: string }`
- **Returns**: `{ success: true }`
- **Usage**: Suspend a user

#### `admin.banUser`
- **Type**: Mutation
- **Auth**: Protected (admin only)
- **Input**: `{ userId: number, reason: string }`
- **Returns**: `{ success: true }`
- **Usage**: Ban a user

#### `admin.unbanUser`
- **Type**: Mutation
- **Auth**: Protected (admin only)
- **Input**: `{ userId: number }`
- **Returns**: `{ success: true }`
- **Usage**: Unban a user

### Content Moderation Router (`contentModeration.*`)

#### `contentModeration.getUnreviewedFlags`
- **Type**: Query
- **Auth**: Protected (admin/moderator only)
- **Returns**: Array of flagged content objects
- **Usage**: Get content flagged by LLM

#### `contentModeration.reviewFlag`
- **Type**: Mutation
- **Auth**: Protected (admin/moderator only)
- **Input**: `{ flagId: number, verdict: "approved"|"rejected" }`
- **Returns**: `{ success: true }`
- **Usage**: Review and approve/reject flagged content

## Socket.IO Events

### Connection Events

#### `connect`
- **Direction**: Server → Client
- **Payload**: None
- **Usage**: Fired when socket connects

#### `disconnect`
- **Direction**: Server → Client
- **Payload**: None
- **Usage**: Fired when socket disconnects

### Presence Events

#### `user:online`
- **Direction**: Client → Server
- **Payload**: None
- **Usage**: Mark user as online

#### `user:away`
- **Direction**: Client → Server
- **Payload**: None
- **Usage**: Mark user as away

#### `stats:online-count`
- **Direction**: Server → Client
- **Payload**: `{ count: number }`
- **Usage**: Broadcast online user count

### Random Chat Events

#### `chat:join-queue`
- **Direction**: Client → Server
- **Payload**: `{ sessionType: "text"|"voice"|"video" }`
- **Usage**: Join matching queue

#### `chat:waiting`
- **Direction**: Server → Client
- **Payload**: `{ position: number, message: string }`
- **Usage**: Notify user waiting for match

#### `chat:matched`
- **Direction**: Server → Client
- **Payload**: `{ sessionId: number, matchedUserId: number, sessionType: string }`
- **Usage**: Notify users of successful match

#### `chat:skip`
- **Direction**: Client → Server
- **Payload**: None
- **Usage**: Skip current match and find new one

#### `chat:leave-queue`
- **Direction**: Client → Server
- **Payload**: None
- **Usage**: Leave matching queue

#### `chat:left-queue`
- **Direction**: Server → Client
- **Payload**: None
- **Usage**: Confirm left queue

### Text Messaging Events

#### `message:send`
- **Direction**: Client → Server
- **Payload**: `{ sessionId: number, content: string, receiverId: number }`
- **Usage**: Send message in chat session

#### `message:sent`
- **Direction**: Server → Client
- **Payload**: `{ sessionId: number, content: string, timestamp: Date }`
- **Usage**: Confirm message sent

#### `message:received`
- **Direction**: Server → Client
- **Payload**: `{ sessionId: number, senderId: number, content: string, timestamp: Date }`
- **Usage**: Receive message from other user

#### `message:typing`
- **Direction**: Client → Server
- **Payload**: `{ receiverId: number }`
- **Usage**: Notify user is typing

#### `message:user-typing`
- **Direction**: Server → Client
- **Payload**: `{ userId: number }`
- **Usage**: Show typing indicator

#### `message:stop-typing`
- **Direction**: Client → Server
- **Payload**: `{ receiverId: number }`
- **Usage**: Notify user stopped typing

#### `message:user-stop-typing`
- **Direction**: Server → Client
- **Payload**: `{ userId: number }`
- **Usage**: Hide typing indicator

#### `message:flagged`
- **Direction**: Server → Client
- **Payload**: `{ reason: string, confidence?: number }`
- **Usage**: Notify message was flagged

### Private Messaging Events

#### `private-message:send`
- **Direction**: Client → Server
- **Payload**: `{ receiverId: number, content: string }`
- **Usage**: Send private message to friend

#### `private-message:sent`
- **Direction**: Server → Client
- **Payload**: `{ receiverId: number, content: string, timestamp: Date }`
- **Usage**: Confirm private message sent

#### `private-message:received`
- **Direction**: Server → Client
- **Payload**: `{ senderId: number, content: string, timestamp: Date }`
- **Usage**: Receive private message

#### `private-message:flagged`
- **Direction**: Server → Client
- **Payload**: `{ reason: string }`
- **Usage**: Notify private message was flagged

### WebRTC Signaling Events

#### `webrtc:offer`
- **Direction**: Client → Server → Client
- **Payload**: `{ receiverId: number, offer: RTCSessionDescription, sessionId: number }`
- **Usage**: Send WebRTC offer

#### `webrtc:answer`
- **Direction**: Client → Server → Client
- **Payload**: `{ receiverId: number, answer: RTCSessionDescription, sessionId: number }`
- **Usage**: Send WebRTC answer

#### `webrtc:ice-candidate`
- **Direction**: Client → Server → Client
- **Payload**: `{ receiverId: number, candidate: RTCIceCandidate, sessionId: number }`
- **Usage**: Send ICE candidate

#### `webrtc:connection-state`
- **Direction**: Client → Server → Client
- **Payload**: `{ receiverId: number, state: string, sessionId: number }`
- **Usage**: Relay connection state

### Call Management Events

#### `call:end`
- **Direction**: Client → Server
- **Payload**: `{ sessionId: number, duration: number }`
- **Usage**: End call session

#### `call:ended`
- **Direction**: Server → Client
- **Payload**: `{ sessionId: number }`
- **Usage**: Notify call ended

### Notification Events

#### `notification:subscribe`
- **Direction**: Client → Server
- **Payload**: None
- **Usage**: Subscribe to user notifications

## Error Handling

### tRPC Errors
- **401 Unauthorized**: User not authenticated
- **403 Forbidden**: User lacks required permissions
- **400 Bad Request**: Invalid input data
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server error

### Socket.IO Errors
- **Authentication error**: Invalid or missing userId in auth
- **Message flagged**: Content violates moderation policy
- **User blocked**: Cannot communicate with blocked user

## Rate Limiting

All endpoints are rate-limited to prevent abuse:
- **Public endpoints**: 100 requests per minute
- **Protected endpoints**: 1000 requests per minute
- **Admin endpoints**: 10000 requests per minute

## Content Moderation

### Automatic Flagging
Messages are automatically scanned for:
- Profanity
- Harassment
- Hate speech
- Explicit content
- Spam

### Human Review
Flagged content is queued for human moderator review via the admin dashboard.

## Pagination

List endpoints support pagination:
- **limit**: Maximum number of results (default: 50, max: 100)
- **offset**: Number of results to skip (default: 0)

## Timestamps

All timestamps are returned as ISO 8601 strings in UTC timezone.

## Examples

### Join Random Chat
```javascript
socket.emit('chat:join-queue', { sessionType: 'text' });
socket.on('chat:matched', (data) => {
  console.log('Matched with user:', data.matchedUserId);
  console.log('Session ID:', data.sessionId);
});
```

### Send Message
```javascript
socket.emit('message:send', {
  sessionId: 123,
  content: 'Hello!',
  receiverId: 456
});
```

### Get Friend Requests
```javascript
const requests = await trpc.friends.getFriendRequests.useQuery();
```

### Report User
```javascript
await trpc.reports.reportUser.useMutation({
  reportedUserId: 789,
  reason: 'harassment',
  description: 'User was being inappropriate'
});
```

## Support

For API issues or questions, contact support@connectnow.app
