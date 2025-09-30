# WebSocket Events Reference

Quick reference guide for all WebSocket events across the unified gateways.

## 🌐 Connection

### Global Namespace: `/`

All three gateways share the root namespace. Connect once to access all features.

**Connection URL**: `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`

**Authentication**: Include JWT token in:
- Query parameter: `?token=your-jwt-token`
- Auth object: `{ auth: { token: 'your-jwt-token' } }`

---

## 📡 Lifecycle Events

### `connected` (incoming)
Emitted by server immediately after connection.

**Payload**:
```json
{
  "status": "ok",
  "clientId": "abc123",
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

---

## 🎯 EventsGateway

All events require authentication (`@UseGuards(WsJwtAuthGuard)`).

### `joinEvent` (outgoing)
Join an event room.

**Emit**:
```javascript
socket.emit('joinEvent', eventId, (ack) => {
  console.log(ack); // { status: 'joined' }
});
```

**Request**: `number` (eventId)

**Acknowledgment**:
```json
{
  "status": "joined"
}
```

**Side Effects**:
- Socket joins room `event:{eventId}`
- User-socket mapping stored

---

### `leaveEvent` (outgoing)
Leave an event room.

**Emit**:
```javascript
socket.emit('leaveEvent', eventId, (ack) => {
  console.log(ack); // { status: 'left' }
});
```

**Request**: `number` (eventId)

**Acknowledgment**:
```json
{
  "status": "left"
}
```

**Side Effects**:
- Socket leaves room `event:{eventId}`
- Service-layer cleanup executed

---

### `sendMessage` (outgoing)
Send a message to an event.

**Emit**:
```javascript
socket.emit('sendMessage', {
  eventId: 1,
  message: {
    text: 'Hello, event!'
  }
}, (ack) => {
  console.log(ack); // Full message object
});
```

**Request**:
```typescript
{
  eventId: number;
  message: {
    text: string;
  }
}
```

**Acknowledgment**: Full message object with:
```json
{
  "id": 123,
  "text": "Hello, event!",
  "userId": 1,
  "eventId": 1,
  "createdAt": "2025-09-30T12:00:00.000Z",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Broadcast**: All clients in `event:{eventId}` receive:

---

### `newMessage` (incoming)
Broadcast when a new message is sent to the event.

**Payload**: Same as `sendMessage` acknowledgment (full message object)

**Received by**: All members of `event:{eventId}` room

---

## 🏘️ CommunityChatGateway

All events require authentication (`@UseGuards(WsJwtAuthGuard)`).

### `joinCommunity` (outgoing)
Join a community chat room.

**Emit**:
```javascript
socket.emit('joinCommunity', { communityId: 1 }, (ack) => {
  console.log(ack); // { status: 'joined', communityId: 1 }
});
```

**Request**:
```typescript
{
  communityId: number;
}
```

**Acknowledgment**:
```json
{
  "status": "joined",
  "communityId": 1
}
```

**Side Effects**:
- Socket joins room `community:{communityId}`
- User-socket mapping stored
- Access verification performed

---

### `joinedCommunity` (incoming)
Emitted to the client after successfully joining a community.

**Payload**:
```json
{
  "communityId": 1
}
```

**Received by**: The joining client only

---

### `sendMessage` (outgoing)
Send a message to a community.

**Emit**:
```javascript
socket.emit('sendMessage', {
  communityId: 1,
  text: 'Hello, community!',
  replyToMessageId: null // Optional
}, (ack) => {
  console.log(ack); // { status: 'sent', messageId: 123 }
});
```

**Request**:
```typescript
{
  communityId: number;
  text: string;
  replyToMessageId?: number;
}
```

**Acknowledgment**:
```json
{
  "status": "sent",
  "messageId": 123
}
```

---

### `communityMessage` (incoming)
Broadcast when a new message is sent to the community.

**Payload**: Full message object
```json
{
  "id": 123,
  "text": "Hello, community!",
  "userId": 1,
  "communityId": 1,
  "replyToMessageId": null,
  "createdAt": "2025-09-30T12:00:00.000Z",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Received by**: All members of `community:{communityId}` room

---

## 💬 PrivateChatGateway

All events require authentication (`@UseGuards(WsJwtAuthGuard)`).

### `identify` (outgoing)
Identify the user for private chat functionality.

**Emit**:
```javascript
socket.emit('identify', (ack) => {
  console.log(ack); // { status: 'ok' }
});
```

**Request**: No payload needed

**Acknowledgment**:
```json
{
  "status": "ok"
}
```

**Side Effects**:
- Socket joins room `user:{userId}`
- User-socket mapping stored

---

### `identified` (incoming)
Emitted to the client after successful identification.

**Payload**:
```json
{
  "userId": 1
}
```

**Received by**: The identifying client only

---

### `joinPrivateChat` (outgoing)
Join a private conversation room.

**Emit**:
```javascript
socket.emit('joinPrivateChat', { conversationId: 1 }, (ack) => {
  console.log(ack); // { status: 'joined', chatId: 1 }
});
```

**Request**:
```typescript
{
  conversationId: number;
}
```

**Acknowledgment**:
```json
{
  "status": "joined",
  "chatId": 1
}
```

**Side Effects**:
- Socket joins room `conversation:{conversationId}`
- Access verification performed

---

### `joinedPrivateChat` (incoming)
Emitted to the client after successfully joining a private chat.

**Payload**:
```json
{
  "chatId": 1
}
```

**Received by**: The joining client only

---

### `sendMessage` (outgoing)
Send a private message.

**Option 1: Existing Conversation**
```javascript
socket.emit('sendMessage', {
  conversationId: 1,
  text: 'Hello, private!',
  replyToId: null // Optional
}, (ack) => {
  console.log(ack); // { status: 'sent', messageId: 456 }
});
```

**Option 2: New Conversation**
```javascript
socket.emit('sendMessage', {
  receiverId: 2,
  text: 'Starting a new chat!',
  replyToId: null // Optional
}, (ack) => {
  console.log(ack); // { status: 'sent', messageId: 456 }
});
```

**Request**:
```typescript
{
  text: string;
  conversationId?: number;  // For existing conversation
  receiverId?: number;      // For new conversation
  replyToId?: number;       // Optional reply reference
}
```

**Acknowledgment**:
```json
{
  "status": "sent",
  "messageId": 456
}
```

---

### `privateMessage` (incoming)
Broadcast when a new private message is sent.

**Payload**: Full message object
```json
{
  "id": 456,
  "text": "Hello, private!",
  "senderId": 1,
  "conversationId": 1,
  "replyToId": null,
  "createdAt": "2025-09-30T12:00:00.000Z",
  "isRead": false,
  "sender": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Received by**: 
- All members of `conversation:{conversationId}` room
- Both participants via `user:{userId}` rooms

---

### `markRead` (outgoing)
Mark messages in a conversation as read.

**Emit**:
```javascript
socket.emit('markRead', {
  conversationId: 1,
  upToMessageId: 456 // Optional
}, (ack) => {
  console.log(ack); // { success: true }
});
```

**Request**:
```typescript
{
  conversationId: number;
  upToMessageId?: number;  // Optional: mark up to specific message
}
```

**Acknowledgment**:
```json
{
  "success": true
}
```

---

### `messagesRead` (incoming)
Broadcast when someone marks messages as read.

**Payload**:
```json
{
  "conversationId": 1,
  "userId": 1,
  "readAt": "2025-09-30T12:00:00.000Z"
}
```

**Received by**: All members of `conversation:{conversationId}` room

---

## 🎭 Event Name Summary

### Outgoing (Client → Server)

| Event | Gateway | Authentication | Description |
|-------|---------|---------------|-------------|
| `joinEvent` | Events | Required | Join event room |
| `leaveEvent` | Events | Required | Leave event room |
| `sendMessage` | Events | Required | Send message to event |
| `joinCommunity` | Community | Required | Join community room |
| `sendMessage` | Community | Required | Send message to community |
| `identify` | PrivateChat | Required | Identify user |
| `joinPrivateChat` | PrivateChat | Required | Join conversation room |
| `sendMessage` | PrivateChat | Required | Send private message |
| `markRead` | PrivateChat | Required | Mark messages as read |

### Incoming (Server → Client)

| Event | Gateway | Trigger | Description |
|-------|---------|---------|-------------|
| `connected` | Global | On connect | Connection confirmation |
| `newMessage` | Events | sendMessage | New event message |
| `joinedCommunity` | Community | joinCommunity | Community join confirmation |
| `communityMessage` | Community | sendMessage | New community message |
| `identified` | PrivateChat | identify | Identity confirmation |
| `joinedPrivateChat` | PrivateChat | joinPrivateChat | Chat join confirmation |
| `privateMessage` | PrivateChat | sendMessage | New private message |
| `messagesRead` | PrivateChat | markRead | Read receipt notification |

---

## 🏠 Room Structure

| Room Pattern | Purpose | Members |
|--------------|---------|---------|
| `event:{eventId}` | Event-specific room | Event participants |
| `community:{communityId}` | Community-specific room | Community members |
| `conversation:{conversationId}` | Private conversation room | Conversation participants (2 users) |
| `user:{userId}` | User-specific room | All sockets of a user |

---

## 🔐 Authentication

All protected events use `@UseGuards(WsJwtAuthGuard)`.

**How it works**:
1. Client provides JWT token during connection
2. Token is validated on protected event handlers
3. User info is extracted and stored in `client.data.user`
4. User ID is accessed via `client.data.user.sub`

**Token Requirements**:
- Valid JWT format
- Not expired
- Contains user ID in `sub` claim

---

## 💡 Usage Examples

### Complete Connection Flow

```javascript
const socket = io('http://localhost:3000', {
  transports: ['websocket'],
  auth: { token: 'your-jwt-token' }
});

// Wait for connection
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Connection confirmation
socket.on('connected', (data) => {
  console.log('Server confirmed:', data);
});

// Now use all three gateways over this single connection

// EventsGateway
socket.emit('joinEvent', 1, (ack) => {
  console.log('Joined event:', ack);
});

// CommunityChatGateway
socket.emit('joinCommunity', { communityId: 1 }, (ack) => {
  console.log('Joined community:', ack);
});

// PrivateChatGateway
socket.emit('identify', (ack) => {
  console.log('Identified:', ack);
});
```

### Listening for Events

```javascript
// Event messages
socket.on('newMessage', (message) => {
  console.log('New event message:', message);
});

// Community messages
socket.on('communityMessage', (message) => {
  console.log('New community message:', message);
});

// Private messages
socket.on('privateMessage', (message) => {
  console.log('New private message:', message);
});

// Read receipts
socket.on('messagesRead', (data) => {
  console.log('Messages read:', data);
});
```

---

## 🐛 Error Handling

Errors are emitted via the `exception` event:

```javascript
socket.on('exception', (error) => {
  console.error('Error:', error);
  // error.status - HTTP-like status code
  // error.message - Error message
});
```

Common errors:
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (no access to resource)
- **404**: Not found (resource doesn't exist)
- **400**: Bad request (invalid data)

---

## 📝 Notes

1. **Event Name Reuse**: `sendMessage` is used across multiple gateways but distinguished by payload structure.
2. **Single Connection**: All features work over one WebSocket connection.
3. **Room Isolation**: Rooms are properly isolated; no cross-room data leakage.
4. **Dual Communication**: Actions return both acknowledgments AND emit events.
5. **Broadcast Pattern**: Room broadcasts ensure all participants receive updates in real-time.
