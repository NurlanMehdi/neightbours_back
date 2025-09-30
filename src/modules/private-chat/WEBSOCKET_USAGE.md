# Private Chat WebSocket Gateway Usage

## Overview
The `PrivateChatGateway` provides real-time messaging capabilities for private conversations between users.

### Key Features
- **Auto-conversation creation**: Send messages directly to a user by `receiverId` without manually creating a conversation first
- **Real-time messaging**: Messages are instantly broadcast to all participants
- **JWT Authentication**: All events require authentication
- **Automatic room joining**: Senders are automatically joined to conversation rooms when sending messages

## Connection
Connect to the WebSocket server with JWT authentication:
```javascript
const socket = io('ws://localhost:3000', {
  transports: ['websocket'],
  auth: {
    token: 'your-jwt-token'
  }
});
```

## Events

### Client → Server

#### 1. `private:join`
Join a private chat conversation
```javascript
socket.emit('private:join', { conversationId: 123 }, (response) => {
  console.log(response); // { status: 'joined', conversationId: 123 }
});
```

#### 2. `private:leave`
Leave a private chat conversation
```javascript
socket.emit('private:leave', { conversationId: 123 }, (response) => {
  console.log(response); // { status: 'left', conversationId: 123 }
});
```

#### 3. `private:sendMessage`
Send a message to a conversation. You can either:
- Use `conversationId` to send to an existing conversation
- Use `receiverId` to send to a user (will auto-create conversation if needed)

**Option A: Using conversationId (existing conversation)**
```javascript
socket.emit('private:sendMessage', {
  conversationId: 123,
  text: 'Hello!',
  replyToMessageId: 456 // optional
}, (response) => {
  console.log(response); 
  // { status: 'sent', messageId: 789, conversationId: 123 }
});
```

**Option B: Using receiverId (auto-create conversation)**
```javascript
socket.emit('private:sendMessage', {
  receiverId: 42,      // ID of the user to message
  text: 'Hello!',
  replyToMessageId: 456 // optional
}, (response) => {
  console.log(response); 
  // { status: 'sent', messageId: 789, conversationId: 125 }
  // conversationId will be the newly created or existing conversation
});
```

**Note:** The sender is automatically joined to the conversation room upon sending a message.

### Server → Client

#### 1. `private:connected`
Emitted when client successfully connects
```javascript
socket.on('private:connected', (data) => {
  console.log(data); 
  // { status: 'ok', clientId: 'socket-id', timestamp: '2025-09-30T...' }
});
```

#### 2. `private:joined`
Emitted when successfully joined a conversation (both explicit join and auto-join scenarios)
```javascript
socket.on('private:joined', (data) => {
  console.log(data); // { conversationId: 123 }
});
```
**Note:** This event is emitted automatically when sending a message to a conversation you're not yet in.

#### 3. `private:message`
Emitted when a new message is received in the conversation
```javascript
socket.on('private:message', (message) => {
  console.log(message);
  // {
  //   id: 789,
  //   conversationId: 123,
  //   senderId: 1,
  //   text: 'Hello!',
  //   createdAt: '2025-09-30T...',
  //   replyToMessageId: 456,
  //   sender: { ... },
  //   replyToMessage: { ... }
  // }
});
```

## Room Structure
- Each conversation has its own room: `private:{conversationId}`
- Only authenticated participants can join conversation rooms
- Messages are broadcast to all clients in the conversation room
- Senders are automatically joined to rooms when sending messages (no need to manually join first)

## Conversation Auto-Creation Flow
When using `receiverId` instead of `conversationId`:
1. System checks if a conversation already exists between sender and receiver
2. If exists → message is saved and sent to that conversation
3. If not exists → new conversation is created automatically with both participants
4. **Sender** is automatically joined to the conversation room
   - `private:joined` event is emitted to the sender
5. **Receiver** (if online) is automatically joined to the conversation room
   - `private:joined` event is emitted to all receiver's active sockets
6. Message is broadcast to all participants via `private:message`
7. Response includes the `conversationId` (newly created or existing)

## Error Handling
All errors are handled through `WsExceptionFilter` and will emit error events to the client:
```javascript
socket.on('exception', (error) => {
  console.error('WebSocket error:', error);
});
```

## Security
- All events require JWT authentication via `WsJwtAuthGuard`
- Access control: only conversation participants can join and send messages
- Validation: all DTOs are validated using `class-validator`

## Logging
The gateway logs all important operations in Russian:
- User connections/disconnections
- Join/leave events
- Message sending/broadcasting

## DTOs

### JoinPrivateChatDto
```typescript
{
  conversationId: number; // Required, positive integer
}
```

### LeavePrivateChatDto
```typescript
{
  conversationId: number; // Required, positive integer
}
```

### SendPrivateMessageDto
```typescript
{
  conversationId?: number;   // Optional, positive integer (use this OR receiverId)
  receiverId?: number;       // Optional, positive integer (use this OR conversationId)
  text: string;              // Required, non-empty
  replyToMessageId?: number; // Optional, positive integer
}
```

**Note:** Either `conversationId` OR `receiverId` must be provided, but not both.

