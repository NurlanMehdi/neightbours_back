# Private Chat WebSocket Testing - Complete Guide

## 📚 Table of Contents

1. [Overview](#overview)
2. [What Changed](#what-changed)
3. [Testing Options](#testing-options)
4. [Quick Start](#quick-start)
5. [Detailed Test Scenarios](#detailed-test-scenarios)
6. [Troubleshooting](#troubleshooting)
7. [Files Reference](#files-reference)

---

## Overview

This guide covers testing the **refactored Private Chat WebSocket system** that eliminates manual room joins and uses user-based rooms for real-time message delivery.

### Key Changes ✨

- ✅ **No manual join required**: Users don't need to call `private:join` before messaging
- ✅ **User-based rooms**: Uses `user:{userId}` instead of `private:{conversationId}`
- ✅ **Auto-join on connect**: Users automatically join their personal room on connection
- ✅ **First message works**: Messages delivered in real-time from the very first message
- ✅ **Simplified architecture**: Less room management overhead

---

## What Changed

### Before Refactor ❌

```javascript
// Old flow:
1. User connects
2. User calls: socket.emit('private:join', { receivedId: 2 })
3. Server creates room: private:{conversationId}
4. Both users join room
5. Now messages can be sent
6. Problem: First message might arrive before receiver joins room
```

### After Refactor ✅

```javascript
// New flow:
1. User connects → automatically joins user:{userId} room
2. User sends message directly: socket.emit('private:sendMessage', { receiverId: 2, text: '...' })
3. Server emits to both user rooms:
   - io.to('user:1').emit('private:message', ...)
   - io.to('user:2').emit('private:message', ...)
4. Both users receive message in real-time
5. No race conditions!
```

---

## Testing Options

You have **3 ways** to test the system:

### Option 1: Automated Node.js Tests (Recommended)

**Best for**: CI/CD, comprehensive testing, regression testing

```bash
# Install dependencies
npm install socket.io-client

# Set tokens and run
JWT_TOKEN_USER_A="token1" \
JWT_TOKEN_USER_B="token2" \
USER_A_ID="1" \
USER_B_ID="2" \
./test/run-private-chat-tests.sh
```

**Features**:
- ✅ 20+ automated test cases
- ✅ Tests all critical scenarios
- ✅ Detailed pass/fail reporting
- ✅ Perfect for CI/CD pipelines

**Files**:
- `test/private-chat-refactored-tests.js` - Main test script
- `test/run-private-chat-tests.sh` - Runner script

### Option 2: Browser-Based Visual Testing

**Best for**: Manual testing, debugging, visual verification

```bash
# Open in browser
open test/private-chat-browser-test.html
# or
firefox test/private-chat-browser-test.html
```

**Features**:
- ✅ Visual UI for testing
- ✅ Real-time message display
- ✅ Easy token input
- ✅ Great for debugging

**Files**:
- `test/private-chat-browser-test.html` - Interactive browser client

### Option 3: Integration with Frontend

**Best for**: End-to-end testing, production validation

Test with your actual frontend application:

```javascript
// Frontend code example
const socket = io('http://localhost:3000', {
  query: { token: userToken }
});

// No need to call join!
socket.on('connect', () => {
  // Directly send message
  socket.emit('private:sendMessage', {
    receiverId: targetUserId,
    text: 'Hello!'
  });
});

socket.on('private:message', (message) => {
  // Handle received message
  console.log('Received:', message);
});
```

---

## Quick Start

### Step 1: Prepare Test Environment

```bash
# 1. Make sure server is running
npm run start:dev

# 2. Verify server is up
curl http://localhost:3000

# 3. Check database is accessible
psql -U postgres -d neighbours -c "SELECT COUNT(*) FROM users;"
```

### Step 2: Get JWT Tokens

**Method A: Login via API**

```bash
# User A
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","password":"password123"}'

# User B
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+9876543210","password":"password456"}'
```

**Method B: Query database for test users**

```sql
-- Get test users
SELECT id, phone, "firstName", "lastName" 
FROM users 
WHERE phone IN ('+1234567890', '+9876543210');
```

### Step 3: Run Tests

**Quick test with browser**:
```bash
open test/private-chat-browser-test.html
# Paste tokens, connect both users, send message
```

**Automated test**:
```bash
export JWT_TOKEN_USER_A="eyJhbGc..."
export JWT_TOKEN_USER_B="eyJhbGc..."
./test/run-private-chat-tests.sh
```

---

## Detailed Test Scenarios

### Scenario 1: First Message Delivery ⭐ CRITICAL

**Goal**: Verify receiver gets message without calling `private:join`

```bash
# Run automated test
JWT_TOKEN_USER_A="..." JWT_TOKEN_USER_B="..." \
node test/private-chat-refactored-tests.js
```

**Expected Result**:
```
✅ User A sends first message (without join)
✅ User A receives own message in real-time
✅ User B receives first message in real-time (no join required) ⭐
```

### Scenario 2: Bidirectional Messaging

**Goal**: Both users can send and receive messages

**Manual Test** (browser):
1. Open `test/private-chat-browser-test.html`
2. Connect User A and User B
3. Send message from A to B
4. Send message from B to A
5. Verify both receive messages

**Expected**: All messages delivered instantly to both sides

### Scenario 3: Multiple Rapid Messages

**Goal**: System handles burst of messages without loss

**Test**:
```javascript
// Automated test includes this
await clientA.sendMessage(userB, 'Message 1');
await clientA.sendMessage(userB, 'Message 2');
await clientA.sendMessage(userB, 'Message 3');
// All 3 should be received by User B
```

### Scenario 4: Auto-Read Functionality

**Goal**: Auto-read marks messages as read automatically

**Test**:
```javascript
// Enable auto-read
socket.emit('private:autoReadOn', { receivedId: 2 });

// Send message
socket.emit('private:sendMessage', { receiverId: 2, text: 'Test' });

// Server automatically marks as read for receiver
```

### Scenario 5: Conversation Persistence

**Goal**: Multiple messages use same conversationId

**Expected**:
- First message creates conversation
- Subsequent messages reuse same conversationId
- ConversationId can be passed explicitly if known

### Scenario 6: Error Handling

**Test invalid inputs**:

```javascript
// Missing receiverId - should fail
socket.emit('private:sendMessage', { text: 'Hello' }, (response) => {
  // Should receive error
});

// Invalid receiverId - should handle gracefully
socket.emit('private:sendMessage', { 
  receiverId: 999999, 
  text: 'Hello' 
});
```

---

## Troubleshooting

### Problem: "Connection timeout"

**Possible Causes**:
1. Server not running
2. Wrong URL/port
3. Firewall blocking

**Solutions**:
```bash
# Check if server is running
lsof -i :3000

# Check server logs
npm run start:dev

# Try local connection
curl http://localhost:3000
```

### Problem: "Invalid token" / "Недействительный токен"

**Possible Causes**:
1. Token expired
2. Wrong JWT_SECRET
3. Token format incorrect

**Solutions**:
```bash
# Get fresh tokens
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"...","password":"..."}'

# Check JWT_SECRET in .env matches
cat .env | grep JWT_SECRET

# Verify token format (should start with eyJ)
echo $JWT_TOKEN_USER_A | head -c 10
```

### Problem: "User B doesn't receive message"

**This is the CRITICAL test - if this fails, the refactor has issues**

**Debug Steps**:

1. Check server logs:
```bash
npm run start:dev
# Look for: "Сообщение ... создано от ... → ..."
```

2. Verify connection:
```javascript
// In browser console
socket.connected  // Should be true
socket.id        // Should show socket ID
```

3. Check room membership (server-side):
```typescript
// Add this to gateway for debugging
console.log('User rooms:', Array.from(client.rooms));
// Should include: user:{userId}
```

4. Verify receiverId is correct:
```javascript
// Make sure receiverId matches actual user
console.log('Sending to:', receiverId);
console.log('User B ID:', userBId);
```

### Problem: "Auto-read not working"

**Debug**:

```bash
# Check server logs for auto-read processing
# Should see: "Пользователь X авточтение приватного чата Y"

# Verify user has auto-read enabled
# Client should call: socket.emit('private:autoReadOn', { receivedId: ... })

# Check database
psql -U postgres -d neighbours
SELECT * FROM "ReadStatus" 
WHERE "conversationId" = YOUR_CONV_ID 
ORDER BY "readAt" DESC LIMIT 5;
```

---

## Files Reference

### Test Files

| File | Purpose | How to Use |
|------|---------|------------|
| `test/private-chat-refactored-tests.js` | Automated test suite | `node test/private-chat-refactored-tests.js` |
| `test/run-private-chat-tests.sh` | Test runner script | `./test/run-private-chat-tests.sh` |
| `test/private-chat-browser-test.html` | Browser UI for testing | Open in browser |
| `test/QUICKSTART-PRIVATE-CHAT-TESTS.md` | Quick start guide | Read for quick setup |
| `test/PRIVATE-CHAT-TEST-README.md` | Detailed documentation | Read for comprehensive info |

### Implementation Files

| File | What Changed |
|------|--------------|
| `src/modules/private-chat/private-chat.gateway.ts` | Complete refactor - removed join/leave handlers, added auto-join |
| `src/modules/private-chat/private-chat.service.ts` | No changes (kept for compatibility) |
| `src/common/guards/ws-jwt-auth.guard.ts` | No changes (provides JWT auth) |

---

## Success Criteria

The refactored system is working correctly if:

### Must Pass ✅

1. **Connection**: Both users connect successfully
2. **Auto-join**: Users receive `private:connected` event
3. **First message**: User B receives message without calling `private:join`
4. **Real-time**: Messages delivered within 500ms
5. **Bidirectional**: Both users can send/receive
6. **Persistence**: ConversationId maintained across messages

### Should Pass ✅

7. Auto-read functionality works
8. Multiple rapid messages all delivered
9. Special characters handled correctly
10. Long messages delivered successfully
11. Error handling for invalid inputs
12. Reconnection works properly

### Edge Cases ✅

13. Empty text handled
14. Very long text (check server limit)
15. Concurrent messages from both users
16. Network interruption recovery
17. Invalid receiverId handled gracefully

---

## Quick Command Reference

```bash
# Get test tokens
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" \
  -d '{"phone":"USER_PHONE","password":"USER_PASSWORD"}'

# Set environment variables
export JWT_TOKEN_USER_A="eyJhbG..."
export JWT_TOKEN_USER_B="eyJhbG..."
export USER_A_ID="1"
export USER_B_ID="2"

# Run automated tests
./test/run-private-chat-tests.sh

# Run with npm (if you add to package.json)
npm run test:ws:private

# Open browser test
open test/private-chat-browser-test.html

# Check server logs
npm run start:dev

# Check database
psql -U postgres -d neighbours -c "SELECT * FROM users LIMIT 5;"
```

---

## Next Steps After Testing

Once all tests pass:

1. ✅ **Update frontend** to remove `private:join` calls
2. ✅ **Update documentation** for frontend developers
3. ✅ **Deploy to staging** and test with real users
4. ✅ **Monitor logs** for any edge cases
5. ✅ **Load test** with many concurrent users
6. ✅ **Update mobile apps** if applicable

---

## Support & Questions

If you encounter issues:

1. Check this guide first
2. Review server logs for errors
3. Test with browser client for visual debugging
4. Check database for data integrity
5. Review gateway implementation if tests fail consistently

**Key Log Messages to Look For**:

```
✓ Good: "Пользователь X присоединился к личной комнате user:X"
✓ Good: "Сообщение Y создано от X → Z"
✗ Bad: "Клиент ... не аутентифицирован"
✗ Bad: "receiverId is required"
```

---

**Testing Completed**: Ready for production! 🚀

**Last Updated**: October 2025  
**System Version**: 2.0 (Refactored - No Manual Joins)

