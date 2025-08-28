# Unread Messages Flow - Testing Guide

## How the Unread Messages System Works

### 1. Database Schema
- **EventMessage**: Stores all messages sent to events
- **EventRead**: Tracks which events each user has marked as read (userId + eventId + readAt)
- **Event**: Contains event information including `type` (EVENT/NOTIFICATION) and `isActive` status

### 2. Core Logic
The system determines unread messages by:
1. Finding all messages in events where the user is a **participant** (joined the event)
2. Excluding messages sent by the user themselves
3. Excluding messages from inactive events (`isActive: false`)
4. Excluding messages from events the user has marked as read
5. Grouping results by event type (EVENT vs NOTIFICATION)

### 3. Key Endpoints

#### Get Unread Messages
```
GET /api/events/messages/unread
Authorization: Bearer {jwt_token}
```
- Uses JWT token to identify the user (no parameters needed)
- Returns: `{count: {eventId: messageCount}, EVENT: totalEvents, NOTIFICATION: totalNotifications}`

#### Mark Event as Read
```
POST /api/events/{eventId}/read
Authorization: Bearer {token}
```

```
POST /api/events/messages/read
{
  "eventId": 123,
  "userId": 456
}
```

## Testing Scenarios

### Prerequisites Setup
1. **Create test users** in different communities
2. **Create events** of both types (EVENT and NOTIFICATION)
3. **Ensure user membership** in communities

### Test Case 1: Basic Unread Count
```bash
# 1. Send a message to an event
POST /api/events/{eventId}/messages
{
  "text": "Test message"
}

# 2. Check unread count as another user (with different Bearer token)
GET /api/events/messages/unread
Authorization: Bearer {otherUserToken}
# Expected: Should show 1 unread message for the event
```

### Test Case 2: Event Type Separation
```bash
# 1. Send message to EVENT type event
POST /api/events/{eventTypeEventId}/messages
{
  "text": "Event message"
}

# 2. Send message to NOTIFICATION type event  
POST /api/events/{notificationTypeEventId}/messages
{
  "text": "Notification message"
}

# 3. Check unread count
GET /api/events/messages/unread
Authorization: Bearer {userToken}
# Expected: 
# {
#   "count": {"1": 1, "2": 1},
#   "EVENT": 1,
#   "NOTIFICATION": 1
# }
```

### Test Case 3: Inactive Events Filter
```bash
# 1. Set event as inactive (via admin or directly in DB)
UPDATE events SET "isActive" = false WHERE id = {eventId};

# 2. Check unread count
GET /api/events/messages/unread?userId={userId}
# Expected: Inactive event should NOT appear in count
```

### Test Case 4: Mark as Read Functionality
```bash
# 1. Check unread count (should have messages)
GET /api/events/messages/unread?userId={userId}

# 2. Mark event as read
POST /api/events/{eventId}/read
# or
POST /api/events/messages/read
{
  "eventId": 123,
  "userId": 456
}

# 3. Check unread count again
GET /api/events/messages/unread?userId={userId}
# Expected: Event should no longer appear in unread count
```

### Test Case 5: Event Participation Filter
```bash
# 1. Send message to event where user is NOT a participant (hasn't joined)
# 2. Check unread count for that user
GET /api/events/messages/unread?userId={nonParticipantUserId}
# Expected: Should NOT see messages from events they haven't joined
```

### Test Case 6: Exclude Own Messages
```bash
# 1. User sends message to event
POST /api/events/{eventId}/messages
{
  "text": "My own message"
}

# 2. Check own unread count
GET /api/events/messages/unread?userId={sameUserId}
# Expected: Should NOT count their own messages as unread
```

## Sample Test Script

Here's a test script you can run:

```javascript
// test-unread-messages.js
const API_BASE = 'http://localhost:3000/api';
const USER_1_TOKEN = 'your_user_1_token';
const USER_2_TOKEN = 'your_user_2_token';

async function testUnreadMessages() {
  // Test Case 1: Send message as User 1
  const messageResponse = await fetch(`${API_BASE}/events/1/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${USER_1_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: 'Test message from User 1' })
  });
  
  console.log('Message sent:', await messageResponse.json());
  
  // Test Case 2: Check unread for User 2
  const unreadResponse = await fetch(`${API_BASE}/events/messages/unread?userId=2`);
  const unreadData = await unreadResponse.json();
  
  console.log('Unread messages for User 2:', unreadData);
  
  // Test Case 3: Mark as read for User 2
  const markReadResponse = await fetch(`${API_BASE}/events/1/read`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${USER_2_TOKEN}`
    }
  });
  
  console.log('Marked as read:', await markReadResponse.json());
  
  // Test Case 4: Check unread again
  const unreadAfterRead = await fetch(`${API_BASE}/events/messages/unread?userId=2`);
  console.log('Unread after marking as read:', await unreadAfterRead.json());
}

testUnreadMessages().catch(console.error);
```

## Database Queries for Manual Testing

```sql
-- Check messages in an event
SELECT em.*, u.firstName, u.lastName, e.title, e.type, e.isActive
FROM event_messages em
JOIN users u ON em.userId = u.id
JOIN events e ON em.eventId = e.id
WHERE em.eventId = 3;

-- Check read status for a user
SELECT er.*, e.title, e.type 
FROM event_reads er
JOIN events e ON er.eventId = e.id
WHERE er.userId = 1;

-- Check user event participations
SELECT ue.*, e.title, e.type, e.isActive
FROM users_on_events ue
JOIN events e ON ue.eventId = e.id
WHERE ue.userId = 1;

-- Manually mark event as unread (for testing)
DELETE FROM event_reads WHERE userId = 1 AND eventId = 3;
```

## Expected Behavior After Recent Fixes

1. ✅ **Active Events Only**: Only messages from active events (`isActive: true`) are counted
2. ✅ **Type Separation**: EVENT and NOTIFICATION messages are counted separately
3. ✅ **Event Participation**: Only events the user has joined are included
4. ✅ **Read Status**: Events marked as read are excluded from future counts
5. ✅ **Own Messages**: User's own messages don't count as unread for them

## WebSocket Testing

For real-time message testing:

```javascript
// Connect to WebSocket
const socket = io('ws://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});

// Join event room
socket.emit('joinEvent', eventId);

// Send message
socket.emit('sendMessage', {
  eventId: 1,
  message: { text: 'Test WebSocket message' }
});

// Listen for new messages
socket.on('newMessage', (message) => {
  console.log('New message received:', message);
});
```
