# WebSocket Testing Guide

This directory contains comprehensive testing tools for the unified WebSocket gateways (EventsGateway, CommunityChatGateway, PrivateChatGateway).

## 📁 Test Files

1. **websocket-test-plan.md** - Comprehensive manual test plan with detailed test cases
2. **websocket-client-sample.js** - Interactive sample client for manual testing
3. **websocket-automated-tests.js** - Automated test suite with assertions and reporting

## 🚀 Quick Start

### Prerequisites

```bash
npm install socket.io-client
```

### Configuration

Set environment variables or edit the configuration in the test files:

```bash
# Environment variables
export WS_SERVER_URL="http://localhost:3000"
export JWT_TOKEN="your-valid-jwt-token"
export TEST_EVENT_ID="1"
export TEST_COMMUNITY_ID="1"
export TEST_CONVERSATION_ID="1"
export TEST_RECEIVER_ID="2"
```

Or create a `.env` file in the test directory.

## 🧪 Running Tests

### Manual Interactive Testing

Run the sample client to manually test all features:

```bash
node test/websocket-client-sample.js
```

This will:
- Connect to the server
- Test all three gateways sequentially
- Print detailed logs of all events and acknowledgments
- Keep the connection alive to observe broadcasts

### Automated Testing

Run the automated test suite:

```bash
node test/websocket-automated-tests.js
```

This will:
- Execute all test cases automatically
- Validate responses with assertions
- Generate a test results summary
- Exit with code 0 (success) or 1 (failure)

### With Custom Configuration

```bash
WS_SERVER_URL="http://localhost:4000" \
JWT_TOKEN="eyJhbGc..." \
TEST_EVENT_ID="5" \
node test/websocket-automated-tests.js
```

## 📋 Test Coverage

### Connection & Lifecycle
- ✅ Single connection establishment
- ✅ Connected event validation
- ✅ Clean disconnection

### EventsGateway
- ✅ Join event
- ✅ Send message to event
- ✅ Receive broadcast messages
- ✅ Leave event

### CommunityChatGateway
- ✅ Join community
- ✅ Receive joinedCommunity event
- ✅ Send message to community
- ✅ Receive communityMessage broadcast
- ✅ Reply to messages

### PrivateChatGateway
- ✅ Identify user
- ✅ Receive identified event
- ✅ Join private chat
- ✅ Receive joinedPrivateChat event
- ✅ Send message to conversation
- ✅ Receive privateMessage broadcast
- ✅ Start new conversation
- ✅ Mark messages as read
- ✅ Receive messagesRead notification

## 🔧 Customizing Tests

### Adding New Test Cases

Edit `websocket-automated-tests.js`:

```javascript
async function testMyFeature(client, results) {
  console.log('\n🎯 Testing My Feature...');
  
  try {
    const ack = await client.emit('myEvent', { data: 'test' });
    TestUtils.assertExists(ack, 'myEvent ack');
    results.addTest('My Feature Test', 'PASS');
    console.log('  ✅ myEvent works');
  } catch (error) {
    results.addTest('My Feature Test', 'FAIL', error.message);
    console.log('  ❌ myEvent failed:', error.message);
  }
}

// Add to runAllTests()
await testMyFeature(client, results);
```

### Adjusting Timeouts

Modify the timeout in TestClient constructor:

```javascript
const client = new TestClient(CONFIG.serverUrl, CONFIG.jwtToken, 10000); // 10 seconds
```

## 📊 Understanding Test Results

### Automated Test Output

```
🚀 Starting Automated WebSocket Tests

🔌 Testing Connection Lifecycle...
  ✅ Connection established
  ✅ Received connected event with correct structure
  ✅ Clean disconnection

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
⏭️  Skipped: 0
============================================================
```

### Exit Codes
- `0` - All tests passed
- `1` - One or more tests failed

## 🐛 Troubleshooting

### Connection Refused
**Problem**: Cannot connect to server
**Solution**: 
- Ensure the server is running
- Check the `WS_SERVER_URL` is correct
- Verify the server port

### Authentication Failed
**Problem**: Protected actions fail with auth errors
**Solution**:
- Generate a valid JWT token
- Set the `JWT_TOKEN` environment variable
- Ensure the token hasn't expired

### Test Data Not Found
**Problem**: Tests fail with "not found" errors
**Solution**:
- Verify test data exists in database
- Adjust `TEST_EVENT_ID`, `TEST_COMMUNITY_ID`, etc.
- Ensure test user has access to test data

### Timeout Errors
**Problem**: Tests fail with timeout errors
**Solution**:
- Increase timeout values
- Check server performance
- Verify network latency
- Check server logs for errors

## 🔍 Debugging

### Enable Detailed Socket.IO Logs

```bash
DEBUG=socket.io* node test/websocket-automated-tests.js
```

### Add Custom Logging

Edit test files to add more console.log statements:

```javascript
console.log('Request payload:', JSON.stringify(payload, null, 2));
console.log('Response:', JSON.stringify(response, null, 2));
```

## 📝 Manual Testing with Postman

You can also use Postman's WebSocket feature:

1. Create new WebSocket request
2. URL: `ws://localhost:3000/socket.io/?EIO=4&transport=websocket`
3. Add authentication header or query param
4. Send events manually and observe responses

## 🎯 Best Practices

1. **Run tests after changes** - Always run the automated test suite after modifying gateway code
2. **Keep test data fresh** - Regularly update test data IDs in configuration
3. **Monitor server logs** - Check server logs while running tests to catch server-side issues
4. **Test with multiple clients** - Run multiple test clients simultaneously to test room broadcasts
5. **Clean up after tests** - Ensure test data doesn't pollute your database

## 📚 Additional Resources

- [Socket.IO Client Documentation](https://socket.io/docs/v4/client-api/)
- [WebSocket Testing Best Practices](https://socket.io/docs/v4/testing/)
- [NestJS WebSocket Testing](https://docs.nestjs.com/websockets/adapter)

## 🤝 Contributing

When adding new features to gateways:

1. Add test cases to `websocket-test-plan.md`
2. Implement tests in `websocket-automated-tests.js`
3. Update this README if needed
4. Ensure all tests pass before committing

## 📞 Support

For issues or questions:
- Check server logs in development
- Review the test plan for expected behaviors
- Consult the gateway source code
- Ask the development team
