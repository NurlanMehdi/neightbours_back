# WebSocket Gateway Test Plan

## Objective
Validate that all three gateways (EventsGateway, CommunityChatGateway, PrivateChatGateway) work correctly over a single WebSocket connection on the root namespace `/`.

## Test Environment
- **Server URL**: `ws://localhost:3000` (adjust port as needed)
- **Namespace**: `/` (root namespace for all gateways)
- **Transport**: WebSocket only
- **Authentication**: JWT token in query params or auth header

---

## 1. Single Connection Test

### Test Case 1.1: Connect to Root Namespace
**Objective**: Verify that a single connection can access all three gateways.

**Steps**:
1. Connect to `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`
2. Verify connection is established
3. Listen for `connected` event

**Expected Results**:
- Connection successful
- Receive `connected` event with:
  ```json
  {
    "status": "ok",
    "clientId": "<socket-id>",
    "timestamp": "<ISO-8601-timestamp>"
  }
  ```

**Pass Criteria**: ✅ Connection established and `connected` event received

---

## 2. Lifecycle Tests

### Test Case 2.1: Connection Event
**Objective**: Verify proper connection acknowledgment.

**Steps**:
1. Establish WebSocket connection
2. Wait for `connected` event

**Expected Results**:
- Event name: `connected`
- Payload contains: `status`, `clientId`, `timestamp`

**Pass Criteria**: ✅ All fields present and valid

### Test Case 2.2: Disconnection Cleanup
**Objective**: Verify socket-user mappings are cleaned on disconnect.

**Steps**:
1. Connect and authenticate
2. Join rooms (event, community, private chat)
3. Disconnect
4. Reconnect and verify state is fresh

**Expected Results**:
- No orphaned socket mappings
- Clean reconnection without previous state

**Pass Criteria**: ✅ Mappings cleaned, fresh state on reconnect

---

## 3. EventsGateway Tests

### Test Case 3.1: Join Event
**Objective**: User can join an event room.

**Prerequisites**: Valid JWT token, valid eventId

**Steps**:
1. Emit `joinEvent` with `eventId` (number)
2. Wait for acknowledgment

**Expected Results**:
- Ack callback returns: `{ status: 'joined' }`
- Socket joins room `event:{eventId}`

**Pass Criteria**: ✅ Ack received with correct status

### Test Case 3.2: Leave Event
**Objective**: User can leave an event room.

**Prerequisites**: User has joined the event

**Steps**:
1. Emit `leaveEvent` with `eventId` (number)
2. Wait for acknowledgment

**Expected Results**:
- Ack callback returns: `{ status: 'left' }`
- Socket leaves room `event:{eventId}`

**Pass Criteria**: ✅ Ack received with correct status

### Test Case 3.3: Send Message to Event
**Objective**: User can send a message to an event.

**Prerequisites**: User has joined the event

**Steps**:
1. Emit `sendMessage` with payload:
   ```json
   {
     "eventId": 1,
     "message": {
       "text": "Hello, event!"
     }
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns message object with `id`, `text`, `userId`, etc.
- All clients in `event:{eventId}` room receive `newMessage` event with same message

**Pass Criteria**: ✅ Message created and broadcasted

---

## 4. CommunityChatGateway Tests

### Test Case 4.1: Join Community
**Objective**: User can join a community chat room.

**Prerequisites**: Valid JWT token, user is member of community

**Steps**:
1. Emit `joinCommunity` with payload:
   ```json
   { "communityId": 1 }
   ```
2. Wait for acknowledgment and event

**Expected Results**:
- Ack callback returns: `{ status: 'joined', communityId: 1 }`
- Client receives `joinedCommunity` event with: `{ communityId: 1 }`
- Socket joins room `community:{communityId}`

**Pass Criteria**: ✅ Ack received, event emitted, room joined

### Test Case 4.2: Send Message to Community
**Objective**: User can send a message to a community.

**Prerequisites**: User has joined the community

**Steps**:
1. Emit `sendMessage` with payload:
   ```json
   {
     "communityId": 1,
     "text": "Hello, community!",
     "replyToMessageId": null
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns: `{ status: 'sent', messageId: <number> }`
- All clients in `community:{communityId}` room receive `communityMessage` event with full message object

**Pass Criteria**: ✅ Message sent and broadcasted with correct event name

### Test Case 4.3: Reply to Community Message
**Objective**: User can reply to an existing message.

**Prerequisites**: User has joined the community, target message exists

**Steps**:
1. Emit `sendMessage` with payload:
   ```json
   {
     "communityId": 1,
     "text": "This is a reply",
     "replyToMessageId": 5
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns: `{ status: 'sent', messageId: <number> }`
- Message object includes `replyToMessageId: 5`
- Broadcast to all community members

**Pass Criteria**: ✅ Reply created with correct reference

---

## 5. PrivateChatGateway Tests

### Test Case 5.1: Identify User
**Objective**: User identifies themselves for private chat.

**Prerequisites**: Valid JWT token

**Steps**:
1. Emit `identify` (no payload needed)
2. Wait for acknowledgment and event

**Expected Results**:
- Ack callback returns: `{ status: 'ok' }`
- Client receives `identified` event with: `{ userId: <number> }`
- Socket joins room `user:{userId}`

**Pass Criteria**: ✅ User identified and joined user room

### Test Case 5.2: Join Private Chat
**Objective**: User joins a private conversation room.

**Prerequisites**: User is participant in the conversation

**Steps**:
1. Emit `joinPrivateChat` with payload:
   ```json
   { "conversationId": 1 }
   ```
2. Wait for acknowledgment and event

**Expected Results**:
- Ack callback returns: `{ status: 'joined', chatId: 1 }`
- Client receives `joinedPrivateChat` event with: `{ chatId: 1 }`
- Socket joins room `conversation:{conversationId}`

**Pass Criteria**: ✅ Joined conversation room successfully

### Test Case 5.3: Send Private Message (Existing Conversation)
**Objective**: User sends a message to an existing conversation.

**Prerequisites**: User has joined the conversation

**Steps**:
1. Emit `sendMessage` with payload:
   ```json
   {
     "conversationId": 1,
     "text": "Hello, private!"
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns: `{ status: 'sent', messageId: <number> }`
- Both participants receive `privateMessage` event via:
  - `conversation:{conversationId}` room
  - `user:{userId}` rooms for both participants

**Pass Criteria**: ✅ Message sent to all relevant rooms

### Test Case 5.4: Send Private Message (New Conversation)
**Objective**: User starts a new conversation by sending to a receiver.

**Prerequisites**: Valid JWT token, valid receiverId

**Steps**:
1. Emit `sendMessage` with payload:
   ```json
   {
     "receiverId": 2,
     "text": "Hi, starting a new chat!"
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns: `{ status: 'sent', messageId: <number> }`
- New conversation created automatically
- Both sender and receiver get `privateMessage` event

**Pass Criteria**: ✅ New conversation created and message delivered

### Test Case 5.5: Reply to Private Message
**Objective**: User replies to a specific message in conversation.

**Prerequisites**: User has joined the conversation, target message exists

**Steps**:
1. Emit `sendMessage` with payload:
   ```json
   {
     "conversationId": 1,
     "text": "Replying to your message",
     "replyToId": 10
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns: `{ status: 'sent', messageId: <number> }`
- Message includes `replyToId: 10`
- Both participants receive the reply

**Pass Criteria**: ✅ Reply sent with correct reference

### Test Case 5.6: Mark Messages as Read
**Objective**: User marks conversation messages as read.

**Prerequisites**: User has joined the conversation

**Steps**:
1. Emit `markRead` with payload:
   ```json
   {
     "conversationId": 1,
     "upToMessageId": 15
   }
   ```
2. Wait for acknowledgment and broadcast

**Expected Results**:
- Ack callback returns: `{ success: true }`
- All clients in `conversation:{conversationId}` receive `messagesRead` event:
  ```json
  {
    "conversationId": 1,
    "userId": <number>,
    "readAt": "<ISO-8601-timestamp>"
  }
  ```

**Pass Criteria**: ✅ Read status updated and broadcasted

---

## 6. Cross-Gateway Integration Tests

### Test Case 6.1: Multiple Features Simultaneously
**Objective**: Verify all features work on single connection.

**Steps**:
1. Connect once
2. Join an event (`joinEvent`)
3. Join a community (`joinCommunity`)
4. Identify for private chat (`identify`)
5. Join a private chat (`joinPrivateChat`)
6. Send messages to all three channels
7. Verify all messages are delivered correctly

**Expected Results**:
- Single socket connection handles all operations
- No namespace conflicts
- All events use unique names
- All messages delivered to correct rooms

**Pass Criteria**: ✅ All features work without interference

### Test Case 6.2: Event Name Collision Prevention
**Objective**: Ensure no event name collisions between gateways.

**Event Names by Gateway**:
- **EventsGateway**: `joinEvent`, `leaveEvent`, `sendMessage`, `newMessage`
- **CommunityChatGateway**: `joinCommunity`, `sendMessage`, `joinedCommunity`, `communityMessage`
- **PrivateChatGateway**: `identify`, `joinPrivateChat`, `sendMessage`, `identified`, `joinedPrivateChat`, `privateMessage`, `markRead`, `messagesRead`

**Note**: `sendMessage` is reused across gateways but distinguished by payload structure.

**Steps**:
1. Subscribe to all event types
2. Trigger actions from each gateway
3. Verify correct events are received with correct payloads

**Expected Results**:
- No ambiguity in event routing
- Each action triggers correct event emissions

**Pass Criteria**: ✅ No collisions or misrouted events

---

## 7. Error Handling Tests

### Test Case 7.1: Unauthorized Access
**Objective**: Verify authentication is enforced.

**Steps**:
1. Connect without JWT token
2. Attempt protected actions (`joinEvent`, `joinCommunity`, etc.)

**Expected Results**:
- Connection succeeds
- Protected actions return error/exception
- Clear error messages

**Pass Criteria**: ✅ Unauthorized actions rejected

### Test Case 7.2: Invalid Data
**Objective**: Verify input validation.

**Steps**:
1. Send invalid payloads:
   - Missing required fields
   - Wrong data types
   - Non-existent IDs

**Expected Results**:
- Errors returned via acknowledgment or exception events
- Server doesn't crash
- Clear error messages

**Pass Criteria**: ✅ Invalid data handled gracefully

### Test Case 7.3: Access Control
**Objective**: Verify users can only access authorized resources.

**Steps**:
1. Try joining event/community/conversation user is not member of
2. Try sending messages to unauthorized rooms

**Expected Results**:
- Access denied errors
- No data leakage
- Clear error messages

**Pass Criteria**: ✅ Access control enforced

---

## 8. Performance Tests

### Test Case 8.1: Multiple Concurrent Connections
**Objective**: Verify system handles multiple users.

**Steps**:
1. Connect 10-100 clients simultaneously
2. Have them join various rooms
3. Send messages concurrently
4. Monitor server performance

**Expected Results**:
- All connections handled
- Messages delivered correctly
- Acceptable latency (<100ms)

**Pass Criteria**: ✅ System stable under load

### Test Case 8.2: Room Broadcasting Efficiency
**Objective**: Verify efficient room broadcasts.

**Steps**:
1. Create room with 50 members
2. Send message to room
3. Measure time for all members to receive

**Expected Results**:
- All members receive message
- Broadcast time reasonable (<500ms for 50 users)

**Pass Criteria**: ✅ Broadcasts efficient and reliable

---

## 9. Test Execution Summary

### Manual Testing Checklist
- [ ] Single connection test
- [ ] All EventsGateway actions
- [ ] All CommunityChatGateway actions
- [ ] All PrivateChatGateway actions
- [ ] Cross-gateway integration
- [ ] Error handling
- [ ] Authentication checks

### Automated Testing
- Run automated test suite (see `websocket-client-tests.js`)
- Review test results and logs
- Fix any failing tests
- Re-run until all pass

### Test Data Requirements
- Valid JWT tokens for test users
- Existing events (IDs: 1, 2, 3)
- Existing communities (IDs: 1, 2)
- Test user accounts (at least 3)
- Pre-existing conversations (optional)

---

## 10. Success Criteria

All tests pass with:
- ✅ Single connection handles all features
- ✅ All acknowledgments return correct format
- ✅ All events emitted with correct names and payloads
- ✅ Room management works correctly
- ✅ User-socket mappings maintained properly
- ✅ Error handling is robust
- ✅ No namespace conflicts or event collisions
- ✅ Authentication enforced on protected actions
- ✅ Performance is acceptable
- ✅ Code follows consistent patterns across all gateways
