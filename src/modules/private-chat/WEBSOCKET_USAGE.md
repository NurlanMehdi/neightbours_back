# Private Chat WebSocket Gateway Usage

## Overview
The `PrivateChatGateway` provides real-time messaging capabilities for private conversations between users.

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
Send a message to a conversation
```javascript
socket.emit('private:sendMessage', {
  conversationId: 123,
  text: 'Hello!',
  replyToMessageId: 456 // optional
}, (response) => {
  console.log(response); // { status: 'sent', messageId: 789 }
});
```

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
Emitted when successfully joined a conversation
```javascript
socket.on('private:joined', (data) => {
  console.log(data); // { conversationId: 123 }
});
```

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
  conversationId: number;    // Required, positive integer
  text: string;              // Required, non-empty
  replyToMessageId?: number; // Optional, positive integer
}
```

