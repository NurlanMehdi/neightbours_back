# Private Chat WebSocket Events Reference

## 🔵 Emit Events (Client → Server)

### ✅ 1. `private:join`
**Description:** Join a private chat conversation to receive messages  
**Payload:**
```typescript
{
  conversationId: number  // ID of the conversation to join
}
```
**Response:**
```typescript
{
  status: string           // "joined"
  conversationId: number   // ID of the joined conversation
}
```

---

### ✅ 2. `private:leave`
**Description:** Leave a private chat conversation  
**Payload:**
```typescript
{
  conversationId: number  // ID of the conversation to leave
}
```
**Response:**
```typescript
{
  status: string           // "left"
  conversationId: number   // ID of the left conversation
}
```

---

### ✅ 3. `private:sendMessage`
**Description:** Send a message in a private chat. Supports two modes:
- **Mode A**: Use `conversationId` for existing conversations
- **Mode B**: Use `receiverId` to auto-create conversation if needed

**Payload:**
```typescript
{
  conversationId?: number        // Optional: ID of existing conversation
  receiverId?: number            // Optional: ID of user to message
  text: string                   // Required: Message content (non-empty)
  replyToMessageId?: number      // Optional: ID of message being replied to
}
```
> **Note:** Either `conversationId` OR `receiverId` must be provided (not both)

**Response:**
```typescript
{
  status: string           // "sent"
  messageId: number        // ID of the created message
  conversationId: number   // ID of the conversation (created or existing)
}
```

---

## 🟢 Listen Events (Server → Client)

### ✅ 1. `private:connected`
**Description:** Emitted immediately when client connects to WebSocket  
**Payload:**
```typescript
{
  status: string       // "ok"
  clientId: string     // Socket client ID
  timestamp: string    // ISO timestamp of connection
}
```

---

### ✅ 2. `private:joined`
**Description:** Confirmation that user successfully joined a conversation room  
**Emitted in two scenarios:**
- When user explicitly calls `private:join`
- Automatically when user sends a message to a conversation they're not yet in

**Payload:**
```typescript
{
  conversationId: number  // ID of the joined conversation
}
```

---

### ✅ 3. `private:message`
**Description:** New message broadcast to all participants in the conversation  
**Payload:**
```typescript
{
  id: number                    // Message ID
  conversationId: number        // Conversation ID
  senderId: number              // User ID of sender
  text: string                  // Message content
  createdAt: Date               // Message timestamp
  replyToId?: number            // Optional: ID of replied message
  sender: {                     // Sender information
    id: number
    firstName: string
    lastName: string
    avatar: string | null
  }
  replyTo?: {                   // Optional: Replied message info
    id: number
    text: string
    senderId: number
    createdAt: Date
  }
}
```

---

## 📋 Important Notes

### Authentication
- ✅ All emit events require JWT authentication via `WsJwtAuthGuard`
- ✅ Token must be provided during connection

### Auto-Conversation Creation
When using `receiverId` in `private:sendMessage`:
1. System checks if conversation exists between sender and receiver
2. If exists → message is sent to that conversation
3. If not exists → new conversation is created automatically with both participants
4. **Sender** is automatically joined to the conversation room
   - `private:joined` event is emitted to sender
5. **Receiver** (if online) is automatically joined to the conversation room
   - `private:joined` event is emitted to receiver's active sockets
6. Message is broadcast to both participants via `private:message`
7. Response includes the `conversationId` (newly created or existing)

### Room Management
- Each conversation has a room: `private:{conversationId}`
- Both sender and receiver (if online) are **automatically joined** to rooms when a message is sent
- `private:joined` confirmation is emitted to both parties when auto-joined
- Manual join via `private:join` is optional for pre-existing conversations

### Access Control
- Users must be participants of a conversation to join/send messages
- The system validates participant access before allowing operations
- Messages are only broadcast to authenticated participants in the room

### Error Handling
All errors are emitted through the `exception` event:
```javascript
socket.on('exception', (error) => {
  console.error('WebSocket error:', error);
});
```

### Multi-Device Support
- User-socket mappings support multiple devices
- Each user can have multiple active socket connections
- Messages are delivered to all active connections

---

## 🔧 Example Usage

### Starting a New Conversation
```javascript
// Connect
const socket = io('ws://localhost:3000', {
  transports: ['websocket'],
  auth: { token: 'your-jwt-token' }
});

// Listen for connection
socket.on('private:connected', (data) => {
  console.log('Connected:', data);
});

// Listen for auto-join events
socket.on('private:joined', (data) => {
  console.log('Auto-joined to conversation:', data.conversationId);
  // Save this conversationId for future use
});

// Listen for incoming messages
socket.on('private:message', (message) => {
  console.log('New message:', message);
});

// Send message directly to a user (auto-creates conversation)
socket.emit('private:sendMessage', {
  receiverId: 42,
  text: 'Hello! Want to chat?'
}, (response) => {
  console.log('Message sent:', response);
  // { status: 'sent', messageId: 123, conversationId: 10 }
  // You'll also receive 'private:joined' event automatically
});
```

### Continuing an Existing Conversation
```javascript
// Join the conversation room
socket.emit('private:join', { conversationId: 10 }, (response) => {
  console.log('Joined:', response);
});

// Listen for join confirmation
socket.on('private:joined', (data) => {
  console.log('Joined conversation:', data.conversationId);
});

// Send message using conversationId
socket.emit('private:sendMessage', {
  conversationId: 10,
  text: 'How are you?'
}, (response) => {
  console.log('Message sent:', response);
});

// Leave when done
socket.emit('private:leave', { conversationId: 10 });
```

