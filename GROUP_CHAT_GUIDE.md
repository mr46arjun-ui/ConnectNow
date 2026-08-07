# Archived Group Chat Prototype Guide

> Historical reference only. Secure group text rooms and mentions are enabled
> in the production release. Group calling is now enabled through the
> membership-checked `group-call:*` socket events, but several older examples
> below are not. See `README.md` and the running router for the supported
> production surface.

## Overview

ConnectNow now includes comprehensive group chat and group calling features inspired by WhatsApp's interface design. This guide covers all group-related functionality, APIs, and real-time features.

## Table of Contents

1. [Group Features](#group-features)
2. [Database Schema](#database-schema)
3. [Backend APIs (tRPC)](#backend-apis-trpc)
4. [Socket.IO Events](#socketio-events)
5. [Frontend Components](#frontend-components)
6. [User Tagging & Mentions](#user-tagging--mentions)
7. [Group Calls & WebRTC](#group-calls--webrtc)
8. [Admin Moderation](#admin-moderation)

---

## Group Features

### Core Functionality

- **Create Groups**: Users can create new groups with name, description, and avatar
- **Manage Members**: Add/remove members, assign roles (admin, moderator, member)
- **Group Messaging**: Real-time text messaging with user mentions
- **Message Management**: Edit, delete, and retrieve message history
- **Group Calls**: Audio and video calls with multiple participants
- **User Tagging**: @mention users in messages with autocomplete
- **Typing Indicators**: Show when users are typing
- **Presence Tracking**: See who's online/away in the group
- **Group Invites**: Send and manage group invitations
- **Group Settings**: Update group name, description, and avatar

### WhatsApp-Style Interface

The main chat interface (`MainChat.tsx`) provides a tabbed navigation similar to WhatsApp:

- **Chats Tab**: Personal conversations with friends
- **Groups Tab**: List of groups user is a member of
- **Calls Tab**: Call history (incoming, outgoing, missed)
- **Status Tab**: User status updates (coming soon)

---

## Database Schema

### Groups Table

```sql
CREATE TABLE groups (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar VARCHAR(500),
  createdBy INT NOT NULL,
  memberCount INT DEFAULT 1,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);
```

### Group Members Table

```sql
CREATE TABLE group_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupId INT NOT NULL,
  userId INT NOT NULL,
  role ENUM('admin', 'moderator', 'member') DEFAULT 'member',
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY (groupId, userId),
  FOREIGN KEY (groupId) REFERENCES groups(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Group Messages Table

```sql
CREATE TABLE group_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupId INT NOT NULL,
  senderId INT NOT NULL,
  content TEXT NOT NULL,
  mentions JSON,
  messageType ENUM('text', 'image', 'video', 'file', 'system') DEFAULT 'text',
  mediaUrl VARCHAR(500),
  isEdited BOOLEAN DEFAULT false,
  editedAt TIMESTAMP NULL,
  isDeleted BOOLEAN DEFAULT false,
  deletedAt TIMESTAMP NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (groupId) REFERENCES groups(id),
  FOREIGN KEY (senderId) REFERENCES users(id)
);
```

### Group Calls Table

```sql
CREATE TABLE group_calls (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupId INT NOT NULL,
  initiatorId INT NOT NULL,
  callType ENUM('audio', 'video') NOT NULL,
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  endedAt TIMESTAMP NULL,
  participantCount INT DEFAULT 1,
  duration INT,
  FOREIGN KEY (groupId) REFERENCES groups(id),
  FOREIGN KEY (initiatorId) REFERENCES users(id)
);
```

### Group Call Participants Table

```sql
CREATE TABLE group_call_participants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupCallId INT NOT NULL,
  userId INT NOT NULL,
  joinedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  leftAt TIMESTAMP NULL,
  duration INT,
  FOREIGN KEY (groupCallId) REFERENCES group_calls(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### Group Invites Table

```sql
CREATE TABLE group_invites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  groupId INT NOT NULL,
  invitedUserId INT NOT NULL,
  invitedBy INT NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  respondedAt TIMESTAMP NULL,
  FOREIGN KEY (groupId) REFERENCES groups(id),
  FOREIGN KEY (invitedUserId) REFERENCES users(id),
  FOREIGN KEY (invitedBy) REFERENCES users(id)
);
```

---

## Backend APIs (tRPC)

### Group CRUD Operations

#### Create Group

```typescript
trpc.groups.create.mutate({
  name: "Tech Enthusiasts",
  description: "Discuss latest tech trends",
  avatar: "https://...",
});
```

#### Get Group by ID

```typescript
trpc.groups.getById.query({ groupId: 1 });
```

#### Get User's Groups

```typescript
trpc.groups.getUserGroups.query();
```

#### Update Group

```typescript
trpc.groups.update.mutate({
  groupId: 1,
  name: "Updated Name",
  description: "Updated description",
  avatar: "https://...",
});
```

#### Delete Group

```typescript
trpc.groups.delete.mutate({ groupId: 1 });
```

#### Search Groups

```typescript
trpc.groups.search.query({ query: "tech", limit: 20 });
```

### Group Member Management

#### Add Member

```typescript
trpc.groups.addMember.mutate({
  groupId: 1,
  userId: 2,
  role: "member",
});
```

#### Remove Member

```typescript
trpc.groups.removeMember.mutate({
  groupId: 1,
  userId: 2,
});
```

#### Get Members

```typescript
trpc.groups.getMembers.query({ groupId: 1 });
```

### Group Messaging

#### Send Message

```typescript
trpc.groups.sendMessage.mutate({
  groupId: 1,
  content: "Hello @Alice!",
  mentions: [2],
  messageType: "text",
});
```

#### Get Messages

```typescript
trpc.groups.getMessages.query({
  groupId: 1,
  limit: 50,
  offset: 0,
});
```

#### Delete Message

```typescript
trpc.groups.deleteMessage.mutate({ messageId: 1 });
```

#### Edit Message

```typescript
trpc.groups.editMessage.mutate({
  messageId: 1,
  content: "Updated message",
});
```

### Group Calls

#### Initiate Call

```typescript
trpc.groups.initiateCall.mutate({
  groupId: 1,
  callType: "video",
});
```

#### Join Call

```typescript
trpc.groups.addCallParticipant.mutate({ groupCallId: 1 });
```

#### Leave Call

```typescript
trpc.groups.removeCallParticipant.mutate({ groupCallId: 1 });
```

#### End Call

```typescript
trpc.groups.endCall.mutate({ groupCallId: 1 });
```

#### Get Call Participants

```typescript
trpc.groups.getCallParticipants.query({ groupCallId: 1 });
```

### Group Invites

#### Send Invite

```typescript
trpc.groups.sendInvite.mutate({
  groupId: 1,
  invitedUserId: 2,
});
```

#### Accept Invite

```typescript
trpc.groups.acceptInvite.mutate({
  inviteId: 1,
  groupId: 1,
});
```

#### Reject Invite

```typescript
trpc.groups.rejectInvite.mutate({ inviteId: 1 });
```

#### Get Invites

```typescript
trpc.groups.getInvites.query();
```

---

## Socket.IO Events

### Group Messaging Events

#### Join Group

```typescript
socket.emit("group:join", groupId, userId, userName);
// Receives: group:user-joined
```

#### Leave Group

```typescript
socket.emit("group:leave", groupId, userId, userName);
// Receives: group:user-left
```

#### Send Message

```typescript
socket.emit("group:send-message", {
  groupId: 1,
  senderId: 1,
  senderName: "Alice",
  senderAvatar: "https://...",
  content: "Hello everyone!",
  mentions: [2, 3],
});
// Receives: group:message
```

#### Typing Indicator

```typescript
socket.emit("group:typing", groupId, userId, userName, isTyping);
// Receives: group:user-typing
```

#### Delete Message

```typescript
socket.emit("group:delete-message", groupId, messageId);
// Receives: group:message-deleted
```

### Group Call Events

#### Initiate Call

```typescript
socket.emit("group-call:initiate", {
  groupId: 1,
  initiatorId: 1,
  initiatorName: "Alice",
  callType: "video",
});
// Receives: group-call:initiated
```

#### Join Call

```typescript
socket.emit("group-call:join", {
  groupCallId: 1,
  groupId: 1,
  userId: 1,
  userName: "Alice",
});
// Receives: group-call:user-joined
```

#### Leave Call

```typescript
socket.emit("group-call:leave", {
  groupCallId: 1,
  userId: 1,
  userName: "Alice",
});
// Receives: group-call:user-left
```

#### WebRTC Offer

```typescript
socket.emit("group-call:offer", {
  groupCallId: 1,
  fromUserId: 1,
  toUserId: 2,
  offer: rtcSessionDescription,
});
// Receives: group-call:offer
```

#### WebRTC Answer

```typescript
socket.emit("group-call:answer", {
  groupCallId: 1,
  fromUserId: 1,
  toUserId: 2,
  answer: rtcSessionDescription,
});
// Receives: group-call:answer
```

#### ICE Candidate

```typescript
socket.emit("group-call:ice-candidate", {
  groupCallId: 1,
  fromUserId: 1,
  toUserId: 2,
  candidate: rtcIceCandidate,
});
// Receives: group-call:ice-candidate
```

#### End Call

```typescript
socket.emit("group-call:end", {
  groupCallId: 1,
  groupId: 1,
});
// Receives: group-call:ended
```

### Presence Events

#### Update Presence

```typescript
socket.emit("group:presence", {
  groupId: 1,
  userId: 1,
  userName: "Alice",
  status: "online", // "online" | "away" | "offline"
});
// Receives: group:presence-update
```

### Member Events

#### Member Added

```typescript
socket.emit("group:member-added", {
  groupId: 1,
  userId: 2,
  userName: "Bob",
  role: "member",
});
// Receives: group:member-added
```

#### Member Removed

```typescript
socket.emit("group:member-removed", {
  groupId: 1,
  userId: 2,
  userName: "Bob",
});
// Receives: group:member-removed
```

#### Member Role Changed

```typescript
socket.emit("group:member-role-changed", {
  groupId: 1,
  userId: 2,
  userName: "Bob",
  newRole: "admin",
});
// Receives: group:member-role-changed
```

### Settings Events

#### Settings Updated

```typescript
socket.emit("group:settings-updated", {
  groupId: 1,
  name: "New Name",
  description: "New description",
  avatar: "https://...",
});
// Receives: group:settings-updated
```

---

## Frontend Components

### MainChat.tsx

WhatsApp-style main chat interface with tabbed navigation.

**Features:**

- 4 tabs: Chats, Groups, Calls, Status
- Search bar for finding conversations
- Floating action button to create new groups
- Unread message badges
- Last message preview
- Call history with duration

**Usage:**

```typescript
import MainChat from "@/pages/MainChat"

<Route path="/chat" component={MainChat} />
```

### GroupChat.tsx

Full group messaging interface with user tagging.

**Features:**

- Message history display
- Real-time message receive
- @mention autocomplete
- Group member list
- Group info panel
- Typing indicators
- Message timestamps

**Usage:**

```typescript
import GroupChat from "@/pages/GroupChat"

<Route path="/group/:groupId" component={(props: any) =>
  <GroupChat groupId={parseInt(props.params.groupId)} />
} />
```

### GroupCall.tsx

Full WebRTC video call component for group calls.

**Features:**

- Video grid layout (2x2)
- Mute/unmute button
- Camera on/off toggle
- Screen sharing
- Call timer
- Network quality indicator
- Fullscreen mode
- Participant list

**Usage:**

```typescript
import GroupCall from "@/pages/GroupCall"

<Route path="/group-call/:groupCallId" component={(props: any) =>
  <GroupCall groupCallId={parseInt(props.params.groupCallId)} />
} />
```

---

## User Tagging & Mentions

### How It Works

1. **Type @ Symbol**: When user types `@` in the message input, a dropdown appears
2. **Autocomplete**: Suggestions filter as user types
3. **Select User**: Click on a user to add them to the mention
4. **Highlight in Chat**: Mentioned users are highlighted in blue in the message display
5. **Notification**: Mentioned users receive a notification

### Implementation

**Frontend (GroupChat.tsx):**

```typescript
const handleMessageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
  const text = e.target.value;
  setMessageInput(text);

  // Check for @ mentions
  const lastAtIndex = text.lastIndexOf("@");
  if (lastAtIndex !== -1) {
    const searchText = text.substring(lastAtIndex + 1).toLowerCase();
    const filtered = members.filter(
      m =>
        m.username.toLowerCase().includes(searchText) && m.userId !== user?.id
    );
    setMentionSuggestions(filtered);
    setShowMentionSuggestions(filtered.length > 0);
  }
};

const handleMentionSelect = (member: GroupMember) => {
  const lastAtIndex = messageInput.lastIndexOf("@");
  const beforeMention = messageInput.substring(0, lastAtIndex);
  const newMessage = `${beforeMention}@${member.username} `;
  setMessageInput(newMessage);
  setShowMentionSuggestions(false);
};
```

**Backend (tRPC):**

```typescript
sendMessage: protectedProcedure
  .input(
    z.object({
      groupId: z.number(),
      content: z.string(),
      mentions: z.array(z.number()).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // Extract mentions from content
    const mentionRegex = /@(\w+)/g;
    const mentions: number[] = [];
    let match;
    while ((match = mentionRegex.exec(input.content)) !== null) {
      const mentionedUser = members.find(m => m.username === match[1]);
      if (mentionedUser) {
        mentions.push(mentionedUser.userId);
        // Send notification to mentioned user
        await db.createNotification(
          mentionedUser.userId,
          "group_mention",
          `${ctx.user.name} mentioned you in ${groupName}`,
          groupId
        );
      }
    }

    return await sendGroupMessage(
      input.groupId,
      ctx.user.id,
      input.content,
      mentions
    );
  });
```

---

## Group Calls & WebRTC

### Call Flow

1. **Initiate Call**: User clicks "Start Call" button
2. **Notify Members**: All group members receive a notification
3. **Accept/Decline**: Members can accept or decline the call
4. **WebRTC Setup**: Peer connections are established
5. **Media Streams**: Video/audio streams are exchanged
6. **End Call**: User ends the call or all participants leave

### WebRTC Implementation

**GroupCall.tsx:**

```typescript
const initializeWebRTC = async () => {
  // Get local media stream
  const stream = await navigator.mediaDevices.getUserMedia({
    video: isVideoOn,
    audio: !isMuted,
  });

  // Create peer connection
  const peerConnection = new RTCPeerConnection({
    iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
  });

  // Add local tracks
  stream.getTracks().forEach(track => {
    peerConnection.addTrack(track, stream);
  });

  // Handle remote stream
  peerConnection.ontrack = event => {
    remoteVideoRef.current.srcObject = event.streams[0];
  };

  peerConnectionRef.current = peerConnection;
};
```

### Features

- **Mute/Unmute**: Toggle audio on/off
- **Camera On/Off**: Toggle video on/off
- **Screen Sharing**: Share screen with other participants
- **Call Timer**: Shows call duration
- **Network Quality**: Displays connection quality
- **Participant List**: Shows all participants
- **Fullscreen Mode**: Expand video to fullscreen

---

## Admin Moderation

### Group Moderation Features

- **Remove Members**: Admin can remove members from group
- **Mute Members**: Prevent members from sending messages
- **Delete Messages**: Remove inappropriate messages
- **Ban Users**: Prevent users from joining groups
- **Audit Logs**: Track all admin actions

### Implementation

**tRPC Procedures:**

```typescript
// Remove member
removeMember: protectedProcedure
  .input(z.object({ groupId: z.number(), userId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    // Verify user is admin
    const member = await db.getGroupMember(input.groupId, ctx.user.id);
    if (member?.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }

    await removeGroupMember(input.groupId, input.userId);

    // Log action
    await db.createModerationLog(
      ctx.user.id,
      "remove_member",
      input.userId,
      input.groupId
    );
  });
```

---

## Best Practices

### Performance

- **Lazy Load Messages**: Load messages in batches (pagination)
- **Debounce Typing**: Debounce typing indicators to reduce events
- **Optimize Renders**: Use React.memo for message components
- **Cache Groups**: Cache user's groups locally

### Security

- **Validate Mentions**: Verify mentioned users exist in group
- **Rate Limit Messages**: Prevent spam
- **Sanitize Input**: Remove XSS vulnerabilities
- **Verify Permissions**: Check user is group member before allowing actions

### UX

- **Typing Indicators**: Show when others are typing
- **Read Receipts**: Show when messages are read
- **Message Reactions**: Allow emoji reactions (future feature)
- **Message Search**: Allow searching message history

---

## Future Enhancements

- [ ] Message reactions (emoji)
- [ ] Message search
- [ ] Voice messages
- [ ] File sharing
- [ ] Group announcements
- [ ] Group settings (privacy, notifications)
- [ ] Message forwarding
- [ ] Pinned messages
- [ ] Group description/rules
- [ ] Member roles and permissions
