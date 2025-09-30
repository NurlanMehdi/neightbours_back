# Community Unread Messages - Test Examples & Scenarios

This document provides real-world examples and scenarios for testing the Community unread messages feature.

## 📚 Table of Contents
1. [REST API Examples](#rest-api-examples)
2. [WebSocket Examples](#websocket-examples)
3. [Edge Case Scenarios](#edge-case-scenarios)
4. [Integration Scenarios](#integration-scenarios)
5. [Manual Testing Guide](#manual-testing-guide)

---

## REST API Examples

### Example 1: Simple Unread Count Request

**Setup:**
```typescript
// user1 has:
// - 3 unread messages in community1
// - 0 unread messages in community2
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/communities/unread \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
[
  { "communityId": 1, "unreadCount": 3 },
  { "communityId": 2, "unreadCount": 0 }
]
```

### Example 2: After Reading Messages

**Setup:**
```typescript
// Before: user1 has 5 unread in community1
// Action: user1 marks messages as read via POST /api/communities/1/messages/123/read
// After: readAt updated to now
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/communities/unread \
  -H "Authorization: Bearer eyJhbGc..."
```

**Response:**
```json
[
  { "communityId": 1, "unreadCount": 0 },
  { "communityId": 2, "unreadCount": 0 }
]
```

### Example 3: Multiple Communities

**Setup:**
```typescript
// user1 is member of 5 communities
// Each has different unread counts
```

**Response:**
```json
[
  { "communityId": 1, "unreadCount": 3 },
  { "communityId": 2, "unreadCount": 0 },
  { "communityId": 3, "unreadCount": 12 },
  { "communityId": 4, "unreadCount": 1 },
  { "communityId": 5, "unreadCount": 0 }
]
```

### Example 4: Unauthorized Request

**Request:**
```bash
curl -X GET http://localhost:3000/api/communities/unread
# No Authorization header
```

**Response:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## WebSocket Examples

### Example 1: Request Unread Counts

**Client Code:**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');
  
  // Request unread counts
  socket.emit('community:unread', {}, (response) => {
    console.log('Unread counts:', response);
    /* Output:
    {
      status: "ok",
      data: [
        { communityId: 1, unreadCount: 3 },
        { communityId: 2, unreadCount: 0 }
      ]
    }
    */
  });
});
```

### Example 2: Real-time Updates on New Message

**Scenario:** Two users chatting in community

**User1 Client:**
```typescript
const socket1 = io('http://localhost:3000', {
  auth: { token: user1Token }
});

socket1.on('connect', () => {
  // Join community
  socket1.emit('community:join', { communityId: 1 });
  
  // Listen for unread updates
  socket1.on('community:unread', (data) => {
    console.log('Unread counts updated:', data.data);
    // Update UI badge: data.data[0].unreadCount
  });
  
  // Listen for new messages
  socket1.on('community:message', (message) => {
    console.log('New message:', message.text);
  });
});
```

**User2 Client:**
```typescript
const socket2 = io('http://localhost:3000', {
  auth: { token: user2Token }
});

socket2.on('connect', () => {
  socket2.emit('community:join', { communityId: 1 });
  
  // Send message
  socket2.emit('community:sendMessage', {
    communityId: 1,
    text: 'Hello from user2!'
  }, (response) => {
    console.log('Message sent:', response);
    /* Output:
    {
      status: "sent",
      messageId: 123
    }
    */
  });
});
```

**Result:** User1 automatically receives:
1. `community:message` event with the new message
2. `community:unread` event with updated unread count

### Example 3: Multiple Communities

**Client listening to multiple communities:**
```typescript
const socket = io('http://localhost:3000', {
  auth: { token: token }
});

socket.on('connect', () => {
  // Join multiple communities
  socket.emit('community:join', { communityId: 1 });
  socket.emit('community:join', { communityId: 2 });
  socket.emit('community:join', { communityId: 3 });
  
  // Listen for unread updates (applies to all communities)
  socket.on('community:unread', (data) => {
    data.data.forEach(item => {
      console.log(`Community ${item.communityId}: ${item.unreadCount} unread`);
      // Update UI for each community
      updateBadge(item.communityId, item.unreadCount);
    });
  });
});
```

---

## Edge Case Scenarios

### Scenario 1: Deleted Messages

**Timeline:**
```
10:00 - user2 sends message1 (id: 100)
10:01 - user2 sends message2 (id: 101)
10:02 - user2 sends message3 (id: 102)
10:03 - moderator deletes message2 (isDeleted = true)
10:04 - user1 checks unread
```

**Expected Result:**
- Unread count: 2 (only message1 and message3)
- Deleted message2 is excluded

### Scenario 2: Unmoderated Messages

**Timeline:**
```
10:00 - user2 sends message1 (isModerated = true)
10:01 - user2 sends message2 (isModerated = false) // Flagged by AI
10:02 - user1 checks unread
```

**Expected Result:**
- Unread count: 1 (only message1)
- Unmoderated message2 is excluded

### Scenario 3: Partial Read

**Timeline:**
```
10:00 - user2 sends message1
10:01 - user2 sends message2
10:02 - user1 reads up to message1 (readAt = 10:00)
10:03 - user2 sends message3
10:04 - user1 checks unread
```

**Expected Result:**
- Unread count: 2 (message2 and message3)
- message1 is marked as read

### Scenario 4: Leave Community

**Timeline:**
```
10:00 - user1 is member of communities 1, 2, 3
10:01 - user1 leaves community2
10:02 - user1 checks unread
```

**Expected Result:**
```json
[
  { "communityId": 1, "unreadCount": 3 },
  // community2 NOT included
  { "communityId": 3, "unreadCount": 5 }
]
```

### Scenario 5: New User (Never Read)

**Timeline:**
```
10:00 - user1 joins community1
10:01 - 10 messages exist in community1 (before user joined)
10:02 - user1 checks unread (no CommunityRead record exists)
```

**Expected Result:**
- Unread count: 10
- All messages counted as unread when no CommunityRead exists

---

## Integration Scenarios

### Scenario 1: Full Chat Flow

**Steps:**
1. User1 joins community
2. User2 sends 3 messages
3. User1 checks unread → 3 unread
4. User1 marks as read
5. User1 checks unread → 0 unread
6. User2 sends 1 more message
7. User1 checks unread → 1 unread

**Test Code:**
```typescript
it('should handle full chat flow', async () => {
  // Step 1-2: Setup
  await prisma.communityMessage.createMany({
    data: [
      { communityId: 1, userId: user2Id, text: 'msg1', isModerated: true },
      { communityId: 1, userId: user2Id, text: 'msg2', isModerated: true },
      { communityId: 1, userId: user2Id, text: 'msg3', isModerated: true },
    ]
  });
  
  // Step 3: Check unread
  let response = await request(app.getHttpServer())
    .get('/api/communities/unread')
    .set('Authorization', `Bearer ${user1Token}`);
  expect(response.body[0].unreadCount).toBe(3);
  
  // Step 4: Mark as read
  await prisma.communityRead.create({
    data: { userId: user1Id, communityId: 1, readAt: new Date() }
  });
  
  // Step 5: Check unread again
  response = await request(app.getHttpServer())
    .get('/api/communities/unread')
    .set('Authorization', `Bearer ${user1Token}`);
  expect(response.body[0].unreadCount).toBe(0);
  
  // Step 6: New message
  await prisma.communityMessage.create({
    data: { communityId: 1, userId: user2Id, text: 'msg4', isModerated: true }
  });
  
  // Step 7: Check unread
  response = await request(app.getHttpServer())
    .get('/api/communities/unread')
    .set('Authorization', `Bearer ${user1Token}`);
  expect(response.body[0].unreadCount).toBe(1);
});
```

### Scenario 2: Multi-User WebSocket

**Setup:**
- 3 users in same community
- All connected via WebSocket

**Flow:**
```
user1 → sends message
  ↓
server broadcasts:
  - community:message to all (user1, user2, user3)
  - community:unread to all (updated counts)
  ↓
user2, user3 → receive updates
  - See new message
  - See updated unread count
```

---

## Manual Testing Guide

### Setup Environment

1. **Start server:**
   ```bash
   npm run start:dev
   ```

2. **Get JWT tokens:**
   ```bash
   # User1
   curl -X POST http://localhost:3000/api/auth/verify-sms \
     -H "Content-Type: application/json" \
     -d '{"phone":"+79001111111","code":"123456"}'
   # Save accessToken
   
   # User2
   curl -X POST http://localhost:3000/api/auth/verify-sms \
     -H "Content-Type: application/json" \
     -d '{"phone":"+79002222222","code":"123456"}'
   # Save accessToken
   ```

### Test REST API

**1. Check initial unread counts:**
```bash
curl -X GET http://localhost:3000/api/communities/unread \
  -H "Authorization: Bearer USER1_TOKEN"
```

**2. Send message as user2:**
```bash
curl -X POST http://localhost:3000/api/communities/1/messages \
  -H "Authorization: Bearer USER2_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message"}'
```

**3. Check user1 unread again (should increase):**
```bash
curl -X GET http://localhost:3000/api/communities/unread \
  -H "Authorization: Bearer USER1_TOKEN"
```

**4. Mark as read:**
```bash
curl -X POST http://localhost:3000/api/communities/1/messages/MESSAGE_ID/read \
  -H "Authorization: Bearer USER1_TOKEN"
```

**5. Check unread (should be 0):**
```bash
curl -X GET http://localhost:3000/api/communities/unread \
  -H "Authorization: Bearer USER1_TOKEN"
```

### Test WebSocket

**1. Install wscat:**
```bash
npm install -g wscat
```

**2. Connect:**
```bash
wscat -c "ws://localhost:3000?token=USER1_TOKEN"
```

**3. Join community:**
```json
> {"event":"community:join","data":{"communityId":1}}
```

**4. Request unread:**
```json
> {"event":"community:unread","data":{}}
```

**5. Listen for auto-updates:**
```
# Keep connection open
# In another terminal, send message as user2
# You should receive community:unread event automatically
```

---

## Testing Checklist

### REST API Testing
- [ ] GET /api/communities/unread returns correct structure
- [ ] Unread counts match expected values
- [ ] Returns 401 without token
- [ ] Excludes deleted messages
- [ ] Excludes unmoderated messages
- [ ] Only shows user's communities
- [ ] Updates after marking as read

### WebSocket Testing
- [ ] Connection established successfully
- [ ] community:unread event returns data
- [ ] Auto-broadcast works on new message
- [ ] Multiple users receive updates
- [ ] Handles empty payload
- [ ] Disconnection is clean

### Edge Cases
- [ ] User with no communities
- [ ] User with 0 unread in all communities
- [ ] Community with no messages
- [ ] Very old readAt timestamp
- [ ] Future readAt timestamp (edge case)
- [ ] Concurrent message sending

---

## Performance Testing

### Load Test Example

```typescript
// Test with many communities and messages
describe('Performance: Unread counts with scale', () => {
  it('should handle 50 communities efficiently', async () => {
    // Create 50 communities
    // Add user as member to all
    // Add 100 messages to each
    
    const start = Date.now();
    const response = await request(app.getHttpServer())
      .get('/api/communities/unread')
      .set('Authorization', `Bearer ${token}`);
    const duration = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(duration).toBeLessThan(2000); // Should be < 2 seconds
  });
});
```

---

## Troubleshooting Examples

### Issue 1: Counts Don't Match

**Symptom:**
```json
Expected: 3
Received: 0
```

**Debug Steps:**
```sql
-- Check messages
SELECT * FROM community_messages WHERE communityId = 1 AND isDeleted = false AND isModerated = true;

-- Check read status
SELECT * FROM community_reads WHERE userId = 1 AND communityId = 1;

-- Check membership
SELECT * FROM users_on_communities WHERE userId = 1 AND communityId = 1;
```

### Issue 2: WebSocket Not Receiving Events

**Debug Steps:**
```typescript
// Add debug logging
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.on('error', (err) => console.error('Error:', err));
socket.onAny((event, ...args) => {
  console.log('Event received:', event, args);
});
```

---

**Last Updated:** September 30, 2025  
**Related Files:**
- `test/community-unread.e2e-spec.ts` - Test implementation
- `test/README-COMMUNITY-UNREAD.md` - Test documentation
- `src/modules/community-chat/UNREAD_MESSAGES.md` - Feature docs

