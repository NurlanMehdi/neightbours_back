# Quick Start: Private Chat WebSocket Tests

## 🎯 What This Tests

This test validates that the **refactored Private Chat WebSocket system** works correctly:

- ✅ Users connect and automatically join personal rooms (`user:{userId}`)
- ✅ Messages are delivered in **real-time from the FIRST message** (no manual join needed)
- ✅ Both sender and receiver get messages instantly
- ✅ No `private:join` events required
- ✅ Auto-read functionality works

## 🚀 Quick Start (3 Steps)

### Step 1: Get JWT Tokens for 2 Test Users

You need JWT tokens for two different users. You can get these by:

**Option A: Use existing test users**
```bash
# Login as User 1
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","password":"password123"}'

# Copy the accessToken from response
```

**Option B: Check your database for existing users**
```bash
# Connect to your database and get user IDs
psql -U postgres -d neighbours
SELECT id, "firstName", "lastName", phone FROM users LIMIT 5;
```

### Step 2: Set Environment Variables

```bash
export JWT_TOKEN_USER_A="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export JWT_TOKEN_USER_B="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export USER_A_ID="1"
export USER_B_ID="2"
```

### Step 3: Run the Tests

```bash
# Make sure server is running first
npm run start:dev

# In another terminal, run tests
./test/run-private-chat-tests.sh
```

## 📋 Alternative Methods

### Method 1: One-Liner

```bash
JWT_TOKEN_USER_A="token1" JWT_TOKEN_USER_B="token2" USER_A_ID="1" USER_B_ID="2" node test/private-chat-refactored-tests.js
```

### Method 2: Create a Test Config File

Create `.env.test` in the project root:

```bash
JWT_TOKEN_USER_A=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_TOKEN_USER_B=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
USER_A_ID=1
USER_B_ID=2
WS_SERVER_URL=http://localhost:3000
```

Then run:
```bash
source .env.test
./test/run-private-chat-tests.sh
```

### Method 3: Edit the Shell Script Directly

Open `test/run-private-chat-tests.sh` and add your tokens at the top:

```bash
# Edit these lines:
DEFAULT_USER_A_ID="1"
DEFAULT_USER_B_ID="2"

# Add these lines after the defaults:
JWT_TOKEN_USER_A="your-token-here"
JWT_TOKEN_USER_B="your-token-here"
```

Then just run:
```bash
./test/run-private-chat-tests.sh
```

## 📊 What You'll See

When tests run successfully:

```
🚀 PRIVATE CHAT WEBSOCKET TESTS - REFACTORED SYSTEM
======================================================================

🔌 User A: Connecting to http://localhost:3000...
   ✓ User A: Connected (socket.id: abc123)
   ✓ User A: Received private:connected

🔌 User B: Connecting to http://localhost:3000...
   ✓ User B: Connected (socket.id: def456)
   ✓ User B: Received private:connected

🧪 TEST SUITE 1: Connection & Authentication
  ✅ User A connection via query token
  ✅ User B connection via query token
  ✅ User A receives private:connected event
  ✅ User B receives private:connected event
  ✅ Users auto-joined to personal rooms (user:{userId})

📤 User A: Sending message to user 2: Hello User B! This is the first message without join.
   ✓ User A: Message sent (ID: 123, conversationId: 45)
   📨 User A: Received private:message
   📨 User B: Received private:message

🧪 TEST SUITE 2: First Message Without Manual Join
  ✅ User A sends first message (without join)
  ✅ User A receives own message in real-time
  ✅ User B receives first message in real-time (no join required) ⭐
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

## 🐛 Troubleshooting

### "JWT tokens not provided"

**Solution**: Export the tokens as environment variables:
```bash
export JWT_TOKEN_USER_A="your-token"
export JWT_TOKEN_USER_B="your-token"
```

### "Connection timeout"

**Solutions**:
- Make sure server is running: `npm run start:dev`
- Check if port 3000 is being used
- Verify server URL is correct

### "Недействительный токен" (Invalid token)

**Solutions**:
- Tokens might be expired - get fresh tokens
- Make sure JWT_SECRET in `.env` matches what was used to generate tokens
- Verify tokens are for valid users in the database

### "User B doesn't receive message"

This would indicate a problem with the refactored system. Check:
- Are both users connected successfully?
- Check server logs for errors
- Verify the `PrivateChatGateway` implementation

### "socket.io-client not found"

**Solution**: Install the dependency:
```bash
npm install socket.io-client
```

## 🔍 Testing Specific Features

### Test Only Connection
```bash
# Modify the test file to comment out other test suites
node test/private-chat-refactored-tests.js
```

### Test With Debug Logging

Edit `private-chat-refactored-tests.js` and uncomment debug logs in the `PrivateChatClient` class.

### Test With Different Users

Just change the `USER_A_ID` and `USER_B_ID` environment variables.

## ✅ Success Criteria

The refactored system is working correctly if:

1. ✅ Both users connect successfully
2. ✅ Both users receive `private:connected` event
3. ✅ **User B receives the FIRST message without calling `private:join`** (most critical)
4. ✅ Both users receive messages in real-time
5. ✅ Auto-read functionality works
6. ✅ No errors in server logs

## 📚 Next Steps

After tests pass:

1. Test with the actual frontend application
2. Test with multiple concurrent users
3. Test reconnection scenarios
4. Test with poor network conditions
5. Load test with many simultaneous messages

## 📞 Need Help?

Check these files for more info:
- Full documentation: `test/PRIVATE-CHAT-TEST-README.md`
- Test script: `test/private-chat-refactored-tests.js`
- Gateway implementation: `src/modules/private-chat/private-chat.gateway.ts`

---

**Quick Command Reference**:
```bash
# Get tokens for 2 users (adjust credentials as needed)
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"phone":"+1234567890","password":"pass1"}'
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"phone":"+9876543210","password":"pass2"}'

# Set tokens
export JWT_TOKEN_USER_A="paste-token-1-here"
export JWT_TOKEN_USER_B="paste-token-2-here"

# Run tests
./test/run-private-chat-tests.sh
```

