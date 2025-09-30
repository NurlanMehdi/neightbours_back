# Community Chat Unread Messages Support

## Overview
This document describes the unread messages functionality for Community Chat, which tracks per-user unread message counts across all communities they are members of.

## Database Schema

The existing `CommunityRead` table is used to track read status:

```sql
model CommunityRead {
  id          Int      @id @default(autoincrement())
  userId      Int
  communityId Int
  readAt      DateTime @default(now())

  user      Users     @relation(fields: [userId], references: [id])
  community Community @relation(fields: [communityId], references: [id])

  @@unique([userId, communityId])
  @@map("community_reads")
}
```

- `userId`: The user who read messages
- `communityId`: The community where messages were read
- `readAt`: Timestamp of the last read message
- Unique constraint ensures one record per user per community

## REST API Endpoint

### GET /api/communities/unread

Получить количество непрочитанных сообщений по всем сообществам пользователя.

**Authentication:** Required (JWT Bearer Token)

**Request:**
```http
GET /api/communities/unread
Authorization: Bearer <token>
```

**Response:**
```json
[
  { "communityId": 2, "unreadCount": 5 },
  { "communityId": 3, "unreadCount": 12 },
  { "communityId": 7, "unreadCount": 0 }
]
```

**Status Codes:**
- `200 OK`: Successfully retrieved unread counts
- `401 Unauthorized`: Missing or invalid JWT token

## WebSocket Events

### Event: `community:unread`

Request unread message counts for all user's communities.

**Client → Server:**
```javascript
socket.emit('community:unread', {}, (response) => {
  console.log(response);
  // { status: "ok", data: [{ communityId: 2, unreadCount: 5 }, ...] }
});
```

**Payload:** Optional (can be empty object or undefined)

**Server → Client Response:**
```json
{
  "status": "ok",
  "data": [
    { "communityId": 2, "unreadCount": 5 },
    { "communityId": 3, "unreadCount": 12 }
  ]
}
```

### Automatic Broadcast

When a new message is sent via `community:sendMessage`, the server automatically:
1. Broadcasts the message to all members in the community room
2. **Automatically emits updated unread counts** to all connected members of that community

This means clients receive real-time unread count updates whenever:
- Someone sends a message in the community
- They mark messages as read

## Implementation Details

### Repository Layer
**File:** `repositories/community-chat.repository.ts`

```typescript
async getUnreadCounts(userId: number): Promise<Array<{ communityId: number; unreadCount: number }>>
```

**Logic:**
1. Find all communities where user is a member
2. Get last read timestamp for each community from `CommunityRead` table
3. Count messages with:
   - `createdAt > lastReadAt` (or all if never read)
   - `isDeleted = false`
   - `isModerated = true`
4. Return array of `{ communityId, unreadCount }`

### Service Layer
**File:** `community-chat.service.ts`

```typescript
async getUnreadCounts(userId: number)
```

Simply delegates to the repository method.

### Controller Layer
**File:** `community-chat.controller.ts`

```typescript
@Get('unread')
async getUnreadCounts(@UserId() userId: number)
```

Exposes the REST endpoint with Swagger documentation.

### WebSocket Gateway
**File:** `community-chat.gateway.ts`

#### Handler: `handleGetUnreadCounts`
```typescript
@SubscribeMessage('community:unread')
async handleGetUnreadCounts(client: Socket, payload?: { communityIds?: number[] })
```

Handles client requests for unread counts.

#### Auto-broadcast in `handleSendMessage`
After broadcasting a new message to the community room, the gateway:
1. Gets all member IDs of the community
2. For each member, fetches their updated unread counts
3. Emits `community:unread` event to all connected sockets of each member

## Logging

Debug logs are added at key points:

**Repository:**
- `User {userId} has {count} unread messages in community {communityId}`

**Gateway:**
- `Пользователь {userId} запрашивает счётчики непрочитанных сообщений`
- `Найдено непрочитанных сообщений для пользователя {userId}: {JSON}`
- `Обновлены счётчики непрочитанных для {count} членов сообщества {communityId}`

## Usage Examples

### REST API Example

```typescript
// Fetch unread counts
const response = await fetch('/api/communities/unread', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const unreadCounts = await response.json();
// [{ communityId: 2, unreadCount: 5 }, ...]
```

### WebSocket Example

```typescript
import { io } from 'socket.io-client';

const socket = io('wss://your-server.com', {
  auth: { token: 'your-jwt-token' }
});

// Listen for automatic unread count updates
socket.on('community:unread', (data) => {
  console.log('Unread counts updated:', data.data);
  // Update UI with new counts
  updateUnreadBadges(data.data);
});

// Manually request unread counts
socket.emit('community:unread', {}, (response) => {
  console.log('Current unread counts:', response.data);
});

// Join a community and listen for new messages
socket.emit('community:join', { communityId: 2 }, (response) => {
  console.log('Joined community:', response);
});

socket.on('community:message', (message) => {
  console.log('New message:', message);
  // After receiving a message, you'll automatically receive updated unread counts
});
```

## Marking Messages as Read

To mark messages as read and reset unread count:

**REST API:**
```http
POST /api/communities/:communityId/messages/:messageId/read
Authorization: Bearer <token>
```

This updates the `readAt` timestamp in `CommunityRead` table.

## Performance Considerations

1. **Database Queries**: The `getUnreadCounts` method runs one query per community. For users in many communities, consider caching.

2. **WebSocket Broadcasting**: After each message, unread counts are recalculated for all members. This is acceptable for typical community sizes (10-100 members).

3. **Optimization Ideas**:
   - Add Redis caching for unread counts
   - Batch unread count updates
   - Only broadcast to online users

## Testing

Test the implementation using:
- REST API: Use Postman or curl to test `/api/communities/unread`
- WebSocket: Use the provided test scripts in `test/` directory
- Integration: Test message send → auto-broadcast unread counts flow

## Error Handling

- **Authentication errors**: Returns `401 Unauthorized`
- **WebSocket errors**: Throws `WsException` with descriptive message
- **Database errors**: Logged and propagated to client

