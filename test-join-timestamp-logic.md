# Join Timestamp Logic - Test Scenarios

## ✅ **Fixed Logic**

Messages are now unread only if created **AFTER** both:
1. **joinedAt** timestamp (when user joined the event)
2. **readAt** timestamp (when user last marked event as read)

## 🧪 **Test Scenarios**

### **Scenario 1: New User Joins Event with Old Messages**

```
Timeline:
10:00 - Event created
10:05 - User A joins event  
10:10 - User A sends message: "Hello"
10:15 - User A sends message: "How are you?"
10:20 - User B joins event (joinedAt = 10:20)

Result for User B:
- GET /api/events/messages/unread → {"count": {}, "EVENT": 0, "NOTIFICATION": 0}
- User B sees 0 unread (all messages before join time)
```

### **Scenario 2: New Messages After Join**

```
Continuing from Scenario 1...
10:25 - User A sends message: "Welcome User B!"

Result for User B:
- GET /api/events/messages/unread → {"count": {"123": 1}, "EVENT": 1, "NOTIFICATION": 0}
- User B sees 1 unread (message after join time)
```

### **Scenario 3: Mark as Read, Then New Messages**

```
Continuing from Scenario 2...
10:30 - User B marks event as read (readAt = 10:30)
10:35 - User A sends message: "Another message"

Result for User B:
- After mark as read: {"count": {}, "EVENT": 0, "NOTIFICATION": 0}
- After new message: {"count": {"123": 1}, "EVENT": 1, "NOTIFICATION": 0}
- User B sees 1 unread (message after readAt time)
```

### **Scenario 4: Complex Timeline**

```
Timeline:
09:00 - Event created
09:10 - User A joins event (joinedAt = 09:10)
09:15 - User A sends: "Message 1"
09:20 - User A sends: "Message 2"
09:25 - User B joins event (joinedAt = 09:25)
09:30 - User A sends: "Message 3"
09:35 - User B marks as read (readAt = 09:35)
09:40 - User A sends: "Message 4"

Results:
User A unread: 0 (own messages excluded)
User B unread after join (09:25): 1 ("Message 3" only)
User B unread after mark as read (09:35): 0
User B unread after Message 4 (09:40): 1 ("Message 4" only)
```

## 🔍 **Filter Logic Verification**

For each message, the system checks:

```typescript
const joinedAt = joinedAtMap.get(message.eventId);
const readAt = readAtMap.get(message.eventId);

// Step 1: Must be after join time
if (!joinedAt || message.createdAt <= joinedAt) {
  return false; // Message before join = always read
}

// Step 2: If never marked as read, show as unread
if (!readAt) {
  return true; // Message after join but never read = unread
}

// Step 3: Must be after last read time
return message.createdAt > readAt; // Message after last read = unread
```

## 🎯 **Expected Production Behavior**

### ✅ **Correct Behavior:**
- New user joins event with 100 old messages → sees 0 unread ✅
- After someone sends new message → sees 1 unread ✅
- After marking as read → sees 0 unread ✅
- After another new message → sees 1 unread ✅

### ❌ **Old Buggy Behavior (Fixed):**
- New user joins event with 100 old messages → saw 100 unread ❌
- This was confusing and overwhelming for new users

## 🧪 **Production Test Commands**

```bash
# 1. Create event and add messages (as User A)
POST /api/events/123/join
Authorization: Bearer {userA_token}

POST /api/events/123/messages {"text": "Old message 1"}
POST /api/events/123/messages {"text": "Old message 2"}

# 2. New user joins event (as User B)
POST /api/events/123/join
Authorization: Bearer {userB_token}

# 3. Check unread immediately after join (should be 0)
GET /api/events/messages/unread
Authorization: Bearer {userB_token}
# Expected: {"count": {}, "EVENT": 0, "NOTIFICATION": 0}

# 4. Send new message (as User A)
POST /api/events/123/messages {"text": "New message after User B joined"}

# 5. Check unread again (should be 1)
GET /api/events/messages/unread
Authorization: Bearer {userB_token}
# Expected: {"count": {"123": 1}, "EVENT": 1, "NOTIFICATION": 0}
```

This logic ensures a much better user experience for new event participants! 🎯
