# ConnectNow API Reference (Historical)

> This planning reference can describe endpoints that are not enabled in the
> production build. Secure group text and mention endpoints are enabled, but
> secure group calls are enabled through the `group-call:*` socket events.
> Older request examples below remain historical. The running tRPC router and `README.md`
> are authoritative.

## Base URL

```
https://api.connectnow.app/api/trpc
```

## Authentication

All protected endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

## Response Format

All API responses follow the tRPC format:

```json
{
  "result": {
    "data": {/* response data */}
  }
}
```

## Error Handling

Errors are returned with appropriate HTTP status codes and error messages:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## Authentication Endpoints

### POST `/api/trpc/auth.login`

Login with email and password.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "user": {/* user object */},
      "token": "jwt_token"
    }
  }
}
```

### POST `/api/trpc/auth.signup`

Create a new account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "user": {/* user object */},
      "token": "jwt_token"
    }
  }
}
```

### POST `/api/trpc/auth.logout`

Logout current user.

**Response:**

```json
{
  "result": {
    "data": { "success": true }
  }
}
```

### POST `/api/trpc/auth.requestPasswordReset`

Request a password reset email.

**Request:**

```json
{
  "email": "user@example.com"
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "success": true,
      "message": "Password reset link sent to email"
    }
  }
}
```

### POST `/api/trpc/auth.resetPassword`

Reset password with token.

**Request:**

```json
{
  "token": "reset_token",
  "newPassword": "newpassword123"
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "success": true,
      "message": "Password reset successful"
    }
  }
}
```

---

## User Endpoints

### GET `/api/trpc/user.me`

Get current user profile.

**Response:**

```json
{
  "result": {
    "data": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "username": "johndoe",
      "avatar": "https://...",
      "bio": "Bio text",
      "country": "US",
      "age": 25,
      "isVerified": false,
      "createdAt": "2026-06-15T00:00:00Z"
    }
  }
}
```

### PUT `/api/trpc/user.updateProfile`

Update user profile.

**Request:**

```json
{
  "username": "newusername",
  "bio": "New bio",
  "country": "US",
  "age": 26
}
```

**Response:**

```json
{
  "result": {
    "data": { "success": true }
  }
}
```

### POST `/api/trpc/user.uploadAvatar`

Upload user avatar.

**Request:** (multipart/form-data)

```
file: <image_file>
```

**Response:**

```json
{
  "result": {
    "data": {
      "url": "https://s3.../avatar.jpg",
      "key": "avatars/user_1.jpg"
    }
  }
}
```

---

## Friends Endpoints

### POST `/api/trpc/friends.sendRequest`

Send a friend request.

**Request:**

```json
{
  "recipientId": 2
}
```

**Response:**

```json
{
  "result": {
    "data": { "success": true }
  }
}
```

### POST `/api/trpc/friends.acceptRequest`

Accept a friend request.

**Request:**

```json
{
  "requestId": 1
}
```

**Response:**

```json
{
  "result": {
    "data": { "success": true }
  }
}
```

### GET `/api/trpc/friends.list`

Get user's friends list.

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": 2,
        "name": "Jane Doe",
        "avatar": "https://...",
        "status": "online"
      }
    ]
  }
}
```

---

## Messages Endpoints

### POST `/api/trpc/messages.send`

Send a private message.

**Request:**

```json
{
  "recipientId": 2,
  "content": "Hello!"
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "messageId": 1,
      "timestamp": "2026-06-15T12:00:00Z"
    }
  }
}
```

### GET `/api/trpc/messages.getConversation`

Get conversation with a user.

**Query:**

```
?userId=2&limit=50
```

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "senderId": 1,
        "recipientId": 2,
        "content": "Hello!",
        "timestamp": "2026-06-15T12:00:00Z",
        "isRead": true
      }
    ]
  }
}
```

---

## Groups Endpoints

### POST `/api/trpc/groups.create`

Create a new group.

**Request:**

```json
{
  "name": "Group Name",
  "description": "Group description",
  "members": [2, 3, 4]
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "groupId": 1,
      "name": "Group Name"
    }
  }
}
```

### POST `/api/trpc/groups.sendMessage`

Send a message to a group.

**Request:**

```json
{
  "groupId": 1,
  "content": "Hello group!",
  "mentions": [2, 3]
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "messageId": 1,
      "timestamp": "2026-06-15T12:00:00Z"
    }
  }
}
```

### POST `/api/trpc/groups.initiateCall`

Start a group call.

**Request:**

```json
{
  "groupId": 1
}
```

**Response:**

```json
{
  "result": {
    "data": {
      "callId": 1,
      "startedAt": "2026-06-15T12:00:00Z"
    }
  }
}
```

---

## Admin Endpoints

### GET `/api/trpc/admin.getUserStats`

Get user statistics.

**Response:**

```json
{
  "result": {
    "data": {
      "totalUsers": 1000,
      "activeUsers": 250,
      "newUsersToday": 15
    }
  }
}
```

### GET `/api/trpc/admin.getReports`

Get moderation reports.

**Response:**

```json
{
  "result": {
    "data": [
      {
        "id": 1,
        "reportedUserId": 5,
        "reason": "harassment",
        "status": "pending",
        "createdAt": "2026-06-15T12:00:00Z"
      }
    ]
  }
}
```

### POST `/api/trpc/admin.reviewReport`

Review and take action on a report.

**Request:**

```json
{
  "reportId": 1,
  "action": "ban",
  "reason": "Violation of terms"
}
```

**Response:**

```json
{
  "result": {
    "data": { "success": true }
  }
}
```

---

## Socket.IO Events

### Connection

```javascript
socket.on("connect", () => {
  console.log("Connected");
});
```

### Chat Events

```javascript
// Send message
socket.emit("chat:message", {
  sessionId: "session_id",
  content: "Hello!",
  timestamp: Date.now(),
});

// Receive message
socket.on("chat:message", data => {
  console.log("New message:", data);
});

// Typing indicator
socket.emit("chat:typing", { sessionId: "session_id" });
socket.on("chat:typing", data => {
  console.log("User typing:", data);
});
```

### Group Events

```javascript
// Join group
socket.emit("group:join", { groupId: 1 });

// Send group message
socket.emit("group:message", {
  groupId: 1,
  content: "Hello group!",
  mentions: [2, 3],
});

// Receive group message
socket.on("group:message", data => {
  console.log("Group message:", data);
});
```

### Call Events

```javascript
// Initiate call
socket.emit("call:initiate", { recipientId: 2 });

// Accept call
socket.emit("call:accept", { callId: 1 });

// End call
socket.emit("call:end", { callId: 1 });

// WebRTC offer
socket.emit("call:offer", { callId: 1, offer: sdpOffer });

// WebRTC answer
socket.emit("call:answer", { callId: 1, answer: sdpAnswer });

// ICE candidate
socket.emit("call:ice-candidate", { callId: 1, candidate: iceCandidate });
```

---

## Rate Limiting

All endpoints are rate limited:

- **General API**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per minute
- **Upload endpoints**: 10 requests per hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1623859200
```

---

## Error Codes

| Code                  | Status | Description                       |
| --------------------- | ------ | --------------------------------- |
| UNAUTHORIZED          | 401    | Missing or invalid authentication |
| FORBIDDEN             | 403    | Insufficient permissions          |
| NOT_FOUND             | 404    | Resource not found                |
| BAD_REQUEST           | 400    | Invalid request parameters        |
| CONFLICT              | 409    | Resource already exists           |
| INTERNAL_SERVER_ERROR | 500    | Server error                      |
| TOO_MANY_REQUESTS     | 429    | Rate limit exceeded               |

---

## Pagination

Paginated endpoints support:

```
?limit=50&offset=0
```

Response includes pagination info:

```json
{
  "result": {
    "data": [/* items */],
    "pagination": {
      "total": 1000,
      "limit": 50,
      "offset": 0,
      "hasMore": true
    }
  }
}
```
