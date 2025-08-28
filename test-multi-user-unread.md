# Multi-User Unread Messages Test Scenarios

## ✅ **Current Logic Verification**

The unread messages system works correctly for multiple users:

### **Key Rules:**
1. ✅ **Users only see messages from OTHER users** (`userId: { not: userId }`)
2. ✅ **Users only see events they participate in** (`eventId: { in: userEventIds }`)
3. ✅ **Only messages after readAt timestamp** (`message.createdAt > readAt`)
4. ✅ **Only from active events** (`event: { isActive: true }`)

## 🧪 **Test Scenarios**

### **Scenario 1: Single User in Event**
```
Event participants: [User A]
- User A sends message → User A's unread count: 0 (own message excluded) ✅
- Expected behavior: No unread messages (user only sees own messages)
```

### **Scenario 2: Two Users in Event**
```
Event participants: [User A, User B]
- User A sends message → User B's unread count: 1 ✅
- User A sends message → User A's unread count: 0 (own message excluded) ✅
- User B marks event as read → User B's unread count: 0 ✅
- User A sends NEW message → User B's unread count: 1 ✅
```

### **Scenario 3: Multiple Users in Event**
```
Event participants: [User A, User B, User C]
- User A sends message → User B unread: 1, User C unread: 1 ✅
- User B sends message → User A unread: 1, User C unread: 2 ✅
- User C sends message → User A unread: 2, User B unread: 2 ✅
- User A marks as read → User A unread: 0 ✅
- User B sends NEW message → User A unread: 1 ✅
```

### **Scenario 4: User Leaves Event**
```
Event participants: [User A, User B]
- User A sends message → User B unread: 1 ✅
- User B leaves event (removed from UsersOnEvents)
- User A sends another message → User B unread: 0 (not participant) ✅
```

## 🔍 **Production Test Commands**

### Test with Multiple Users:
```bash
# User A joins event
POST /api/events/123/join
Authorization: Bearer {userA_token}

# User B joins event  
POST /api/events/123/join
Authorization: Bearer {userB_token}

# User A sends message
POST /api/events/123/messages
Authorization: Bearer {userA_token}
{
  "text": "Hello from User A"
}

# User B checks unread (should see 1)
GET /api/events/messages/unread
Authorization: Bearer {userB_token}
# Expected: {"count": {"123": 1}, "EVENT": 1, "NOTIFICATION": 0}

# User A checks unread (should see 0 - own message)
GET /api/events/messages/unread  
Authorization: Bearer {userA_token}
# Expected: {"count": {}, "EVENT": 0, "NOTIFICATION": 0}

# User B marks as read
POST /api/events/123/read
Authorization: Bearer {userB_token}

# User A sends NEW message
POST /api/events/123/messages
Authorization: Bearer {userA_token}
{
  "text": "Another message from User A"
}

# User B checks unread (should see 1 - new message after read)
GET /api/events/messages/unread
Authorization: Bearer {userB_token}
# Expected: {"count": {"123": 1}, "EVENT": 1, "NOTIFICATION": 0}
```

## ⚠️ **Edge Cases to Verify**

1. **Solo user scenario**: User alone in event sends message → should see 0 unread
2. **Mixed event types**: EVENT vs NOTIFICATION messages counted separately
3. **Inactive events**: Messages from inactive events not counted
4. **Non-participant**: Users not in event don't see any messages from it

## 🎯 **Expected Production Behavior**

- ✅ **If you're alone in an event**: Your unread count will always be 0
- ✅ **If others are in the event**: You see their messages as unread
- ✅ **Your own messages**: Never count as unread for you
- ✅ **After marking as read**: Only NEW messages show as unread
- ✅ **Leave event**: Stop seeing unread messages from that event
