# Private Chat WebSocket Tests - Refactored System

## Overview

This test suite validates the refactored Private Chat WebSocket system that eliminates the need for manual join events. The system now uses user-based rooms (`user:{userId}`) and delivers messages in real-time from the very first message.

## Key Features Being Tested

✅ **Auto Room Join**: Users automatically join personal rooms on connection  
✅ **No Manual Join**: No `private:join` or `private:leave` events required  
✅ **First Message Delivery**: Messages delivered in real-time even on the first message  
✅ **User-Based Rooms**: All messaging happens through `user:{userId}` rooms  
✅ **Bidirectional Messaging**: Both users can send and receive messages  
✅ **Auto-Read**: Auto-read functionality works with the new system  
✅ **Conversation Persistence**: ConversationId is maintained across messages  

## Prerequisites

1. **Install dependencies**:
   ```bash
   npm install socket.io-client
   ```

2. **Server must be running**:
   ```bash
   npm run start:dev
   ```

3. **Get JWT tokens for two test users**:
   You need valid JWT tokens for two different users. You can get these by:
   - Logging in via the API (`POST /auth/login`)
   - Using existing test user tokens
   - Creating test users if needed

## Running the Tests

### Method 1: With Environment Variables

```bash
# Set environment variables
export JWT_TOKEN_USER_A="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export JWT_TOKEN_USER_B="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export USER_A_ID="1"
export USER_B_ID="2"
export WS_SERVER_URL="http://localhost:3000"

# Run tests
node test/private-chat-refactored-tests.js
```

### Method 2: Using a Shell Script

Create a file `run-private-chat-tests.sh`:

```bash
#!/bin/bash

# Test user credentials
JWT_TOKEN_USER_A="your-token-here" \
JWT_TOKEN_USER_B="your-token-here" \
USER_A_ID="1" \
USER_B_ID="2" \
WS_SERVER_URL="http://localhost:3000" \
node test/private-chat-refactored-tests.js
```

Make it executable and run:
```bash
chmod +x run-private-chat-tests.sh
./run-private-chat-tests.sh
```

### Method 3: Inline Environment Variables

```bash
JWT_TOKEN_USER_A="token1" JWT_TOKEN_USER_B="token2" USER_A_ID="1" USER_B_ID="2" node test/private-chat-refactored-tests.js
```

## Test Suites

### 1. Connection & Authentication
- ✅ User A connects with token via query parameter
- ✅ User B connects with token via query parameter
- ✅ Users receive `private:connected` event
- ✅ Users auto-joined to personal rooms

### 2. First Message Without Manual Join (CRITICAL)
- ✅ User A sends first message without joining
- ✅ User A receives own message in real-time
- ✅ User B receives message in real-time (no join required)
- ✅ Message structure validation

### 3. Bidirectional Messaging
- ✅ User B replies to User A
- ✅ User A receives reply in real-time
- ✅ Multiple messages in rapid succession

### 4. Auto-Read Functionality
- ✅ Enable auto-read
- ✅ Message delivery with auto-read enabled
- ✅ Disable auto-read

### 5. Edge Cases & Error Handling
- ✅ Send message without receiverId (should fail)
- ✅ Long message text (500 chars)
- ✅ Special characters and emojis

### 6. Conversation Persistence
- ✅ Conversation ID assigned
- ✅ Message with explicit conversationId
- ✅ Reply uses same conversationId

## Expected Output

```
🚀 PRIVATE CHAT WEBSOCKET TESTS - REFACTORED SYSTEM
======================================================================

Configuration:
  Server URL: http://localhost:3000
  User A ID: 1
  User B ID: 2
  Token A provided: true
  Token B provided: true

======================================================================
🧪 TEST SUITE 1: Connection & Authentication
======================================================================
  ✅ User A connection via query token
  ✅ User B connection via query token
  ✅ User A receives private:connected event
  ✅ User B receives private:connected event
  ✅ Users auto-joined to personal rooms (user:{userId})

======================================================================
🧪 TEST SUITE 2: First Message Without Manual Join
======================================================================
  ✅ User A sends first message (without join)
  ✅ User A receives own message in real-time
  ✅ User B receives first message in real-time (no join required)
  ✅ Message structure validation

... [more test output]

======================================================================
📊 TEST RESULTS SUMMARY
======================================================================
Total Tests: 20
✅ Passed: 20
❌ Failed: 0
Success Rate: 100.0%
======================================================================

✅ ALL TESTS PASSED! The refactored system works correctly.
```

## Troubleshooting

### Connection Fails

**Problem**: `Connection timeout` or `connect_error`

**Solutions**:
- Ensure server is running on correct port
- Check JWT tokens are valid and not expired
- Verify JWT_SECRET matches between client and server
- Check firewall/network settings

### Authentication Fails

**Problem**: `Недействительный токен` or `Токен не предоставлен`

**Solutions**:
- Verify JWT tokens are not expired
- Ensure tokens are for different users (User A ≠ User B)
- Check token format (should start with `eyJ`)
- Verify JWT_SECRET is correctly configured

### Messages Not Received

**Problem**: User B doesn't receive messages from User A

**Solutions**:
- Check both users are connected successfully
- Verify `receiverId` is correct
- Check server logs for errors
- Ensure WebSocket connection is stable

### Auto-Read Not Working

**Problem**: Auto-read doesn't mark messages as read

**Solutions**:
- Verify conversation exists
- Check user is connected
- Review server logs for auto-read processing

## Integration with CI/CD

Add to your `.github/workflows/test.yml` or similar:

```yaml
- name: Run Private Chat WebSocket Tests
  run: |
    JWT_TOKEN_USER_A="${{ secrets.TEST_USER_A_TOKEN }}" \
    JWT_TOKEN_USER_B="${{ secrets.TEST_USER_B_TOKEN }}" \
    USER_A_ID="1" \
    USER_B_ID="2" \
    WS_SERVER_URL="http://localhost:3000" \
    node test/private-chat-refactored-tests.js
```

## Debugging

To see detailed WebSocket communication, you can modify the test script to log all events:

```javascript
// In PrivateChatClient constructor, add:
this.socket.onAny((eventName, ...args) => {
  console.log(`[DEBUG] ${this.name}: ${eventName}`, args);
});
```

## What Changed From Old System

### Old System (Before Refactor)
- Required `private:join` event before messaging
- Used conversation-based rooms: `private:{conversationId}`
- First messages could fail if timing was wrong
- Manual room management needed

### New System (After Refactor)
- ✅ No `private:join` event needed
- ✅ Uses user-based rooms: `user:{userId}`
- ✅ First messages always delivered in real-time
- ✅ Automatic room management on connection
- ✅ Simpler, more reliable architecture

## Related Files

- **Test Script**: `test/private-chat-refactored-tests.js`
- **Gateway**: `src/modules/private-chat/private-chat.gateway.ts`
- **Service**: `src/modules/private-chat/private-chat.service.ts`
- **Auth Guard**: `src/common/guards/ws-jwt-auth.guard.ts`

## Support

If tests fail consistently:
1. Check server logs for detailed error messages
2. Verify database connectivity
3. Ensure all migrations are applied
4. Check that `PrivateChatGateway` is properly configured
5. Review recent changes to WebSocket authentication

---

**Last Updated**: October 2025  
**Version**: 2.0 (Refactored System)

