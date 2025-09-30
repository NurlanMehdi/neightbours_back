# WebSocket Tests - Quick Start Guide

Get started with WebSocket testing in under 5 minutes!

## 🚀 Quick Setup

### 1. Prerequisites
The required package (`socket.io-client`) is already installed in the project.

### 2. Get a Valid JWT Token

**Option A: Login via API**
```bash
# Make a login request
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","password":"yourpassword"}'

# Copy the token from the response
```

**Option B: Get from Database** (for testing)
```bash
# If you have direct database access
# Generate a token for a test user
```

### 3. Set Environment Variables

```bash
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export WS_SERVER_URL="http://localhost:3000"
export TEST_EVENT_ID="1"
export TEST_COMMUNITY_ID="1"
export TEST_CONVERSATION_ID="1"
export TEST_RECEIVER_ID="2"
```

Or create a `.env` file in the `test` directory:
```env
JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WS_SERVER_URL=http://localhost:3000
TEST_EVENT_ID=1
TEST_COMMUNITY_ID=1
TEST_CONVERSATION_ID=1
TEST_RECEIVER_ID=2
```

### 4. Ensure Server is Running

```bash
npm run start:dev
```

## 🎯 Run Tests

### Automated Tests (Recommended)

```bash
npm run test:ws
```

This will:
- ✅ Connect to the server
- ✅ Run all test cases automatically
- ✅ Show pass/fail results
- ✅ Exit with appropriate status code

**Example Output:**
```
🚀 Starting Automated WebSocket Tests

🔌 Testing Connection Lifecycle...
  ✅ Connection established
  ✅ Received connected event with correct structure

🎯 Testing EventsGateway...
  ✅ joinEvent works correctly
  ✅ sendMessage works correctly
  ✅ leaveEvent works correctly

🏘️  Testing CommunityChatGateway...
  ✅ joinCommunity ack correct
  ✅ joinedCommunity event received
  ✅ sendMessage ack correct
  ✅ communityMessage broadcast received

💬 Testing PrivateChatGateway...
  ✅ identify ack correct
  ✅ identified event received
  ✅ joinPrivateChat ack correct
  ✅ joinedPrivateChat event received
  ✅ sendMessage ack correct
  ✅ privateMessage broadcast received
  ✅ markRead ack correct
  ✅ messagesRead broadcast received

============================================================
📊 TEST RESULTS SUMMARY
============================================================
Total Tests: 18
✅ Passed: 18
❌ Failed: 0
============================================================
```

### Interactive Sample Client

```bash
npm run test:ws:sample
```

This will:
- 📡 Connect and show connection details
- 🎯 Test EventsGateway with detailed logging
- 🏘️ Test CommunityChatGateway with detailed logging
- 💬 Test PrivateChatGateway with detailed logging
- ⏳ Keep connection alive to observe real-time events

**Perfect for:**
- Debugging
- Understanding event flow
- Manual exploration

## 🛠️ Customization

### Test Different Data

```bash
JWT_TOKEN="your-token" \
TEST_EVENT_ID="5" \
TEST_COMMUNITY_ID="3" \
npm run test:ws
```

### Test Different Server

```bash
WS_SERVER_URL="http://staging.example.com" \
JWT_TOKEN="your-token" \
npm run test:ws
```

### Enable Debug Logs

```bash
DEBUG=socket.io* npm run test:ws
```

## 📋 Before Your First Run

1. **Create Test Data** (if not exists):
   - At least one event with ID 1
   - At least one community with ID 1
   - At least one conversation with ID 1
   - A second user (ID 2) for testing private messages

2. **Verify User Access**:
   - User should be member of event #1
   - User should be member of community #1
   - User should have access to conversation #1

3. **Check Server Status**:
   ```bash
   curl http://localhost:3000/health
   # or whatever health check endpoint you have
   ```

## 🐛 Troubleshooting

### "Connection Refused"
**Problem**: Can't connect to server
**Solution**: 
```bash
# Check if server is running
curl http://localhost:3000
# Start server if needed
npm run start:dev
```

### "Authentication Failed"
**Problem**: JWT token is invalid or expired
**Solution**:
```bash
# Get a fresh token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+1234567890","password":"yourpassword"}'
```

### "Not Found" Errors
**Problem**: Test data doesn't exist
**Solution**:
```bash
# Use different IDs that exist in your database
export TEST_EVENT_ID="2"
export TEST_COMMUNITY_ID="2"
npm run test:ws
```

### "Forbidden" Errors
**Problem**: User doesn't have access
**Solution**:
- Ensure test user is member of the event/community
- Or use a different event/community ID
- Check database: `SELECT * FROM event_participants WHERE userId = ?`

## 📖 Next Steps

1. **Read the Full Test Plan**: `test/websocket-test-plan.md`
2. **Check Event Reference**: `test/websocket-events-reference.md`
3. **Review Sample Code**: `test/websocket-client-sample.js`
4. **Customize Tests**: `test/websocket-automated-tests.js`

## 💡 Tips

### For Development
```bash
# Run in watch mode (re-run on changes)
nodemon test/websocket-automated-tests.js
```

### For CI/CD
```bash
# Add to your CI pipeline
npm run test:ws
# Exit code will be 0 for success, 1 for failure
```

### For Multiple Users
Open multiple terminals and run sample client with different tokens:
```bash
# Terminal 1 (User 1)
JWT_TOKEN="user1-token" npm run test:ws:sample

# Terminal 2 (User 2)
JWT_TOKEN="user2-token" npm run test:ws:sample
```

Both users will see each other's messages in shared rooms!

## 🎓 Learning Path

1. **Start Simple**: Run `npm run test:ws:sample` first
2. **Watch Events**: Observe the detailed logs
3. **Understand Flow**: See how acks and events work together
4. **Run Automated**: Try `npm run test:ws`
5. **Customize**: Modify test scripts for your needs
6. **Integrate**: Add to your testing workflow

## ✅ Checklist

Before running tests, ensure:
- [ ] Server is running on correct port
- [ ] JWT token is valid and not expired
- [ ] Test data exists in database
- [ ] Test user has proper access permissions
- [ ] Environment variables are set
- [ ] socket.io-client is installed (already done)

## 📞 Need Help?

- Check `test/README-WEBSOCKET-TESTS.md` for detailed documentation
- Review `test/websocket-events-reference.md` for event structures
- Look at `test/websocket-client-sample.js` for usage examples
- Check server logs while running tests

---

**Happy Testing! 🎉**
