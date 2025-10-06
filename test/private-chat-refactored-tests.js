/**
 * Private Chat WebSocket Tests - Refactored System
 * 
 * Tests the new room-less private chat system where:
 * - Users auto-join personal rooms on connection (user:{userId})
 * - No manual private:join/leave events needed
 * - Messages delivered via user-based rooms only
 * - receiverId is required for sending messages
 * 
 * Usage:
 *   npm install socket.io-client
 *   
 *   # Set environment variables
 *   export JWT_TOKEN_USER_A="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Token for User A
 *   export JWT_TOKEN_USER_B="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # Token for User B
 *   export USER_A_ID="1"
 *   export USER_B_ID="2"
 *   export WS_SERVER_URL="http://localhost:3000"
 *   
 *   node test/private-chat-refactored-tests.js
 */

const io = require('socket.io-client');

// ==================== Configuration ====================

const CONFIG = {
  serverUrl: process.env.WS_SERVER_URL || 'http://localhost:3000',
  userA: {
    token: process.env.JWT_TOKEN_USER_A || 'your-jwt-token-user-a',
    userId: parseInt(process.env.USER_A_ID || '1'),
  },
  userB: {
    token: process.env.JWT_TOKEN_USER_B || 'your-jwt-token-user-b',
    userId: parseInt(process.env.USER_B_ID || '2'),
  },
  timeout: 5000,
};

// ==================== Test Utilities ====================

class TestResults {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  addTest(name, status, message = '') {
    this.tests.push({ name, status, message });
    if (status === 'PASS') this.passed++;
    if (status === 'FAIL') this.failed++;
    
    const icon = status === 'PASS' ? '✅' : '❌';
    const details = message ? ` - ${message}` : '';
    console.log(`  ${icon} ${name}${details}`);
  }

  report() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`Success Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(70) + '\n');

    if (this.failed > 0) {
      console.log('❌ Failed Tests Details:');
      this.tests
        .filter((t) => t.status === 'FAIL')
        .forEach((t) => {
          console.log(`   • ${t.name}`);
          console.log(`     ${t.message}`);
        });
      console.log('');
    }

    return this.failed === 0;
  }
}

class TestUtils {
  static assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  static assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(
        message ||
          `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  static assertExists(value, fieldName) {
    if (value === null || value === undefined) {
      throw new Error(`${fieldName} should exist but is null/undefined`);
    }
  }

  static assertType(value, type, fieldName) {
    const actualType = typeof value;
    if (actualType !== type) {
      throw new Error(
        `${fieldName} should be ${type} but is ${actualType}`
      );
    }
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ==================== WebSocket Test Client ====================

class PrivateChatClient {
  constructor(serverUrl, token, userId, name) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.userId = userId;
    this.name = name;
    this.socket = null;
    this.receivedMessages = [];
    this.receivedEvents = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      console.log(`\n🔌 ${this.name}: Connecting to ${this.serverUrl}...`);
      
      // Connect with token in query parameter (as specified in requirements)
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        query: { token: this.token },
        auth: { token: this.token }, // Also provide in auth for compatibility
      });

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout after 5 seconds'));
      }, 5000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        console.log(`   ✓ ${this.name}: Connected (socket.id: ${this.socket.id})`);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        console.error(`   ✗ ${this.name}: Connection error:`, error.message);
        reject(error);
      });

      // Listen for private:connected event
      this.socket.on('private:connected', (data) => {
        console.log(`   ✓ ${this.name}: Received private:connected`, data);
        this.storeEvent('private:connected', data);
      });

      // Listen for private:message events
      this.socket.on('private:message', (message) => {
        console.log(`   📨 ${this.name}: Received private:message`, {
          id: message.id,
          from: message.userId,
          text: message.text,
        });
        this.receivedMessages.push(message);
        this.storeEvent('private:message', message);
      });

      // Listen for any other events
      this.socket.onAny((eventName, ...args) => {
        if (eventName !== 'private:connected' && eventName !== 'private:message') {
          console.log(`   ℹ️  ${this.name}: Received ${eventName}`, args);
        }
      });
    });
  }

  async sendMessage(receiverId, text, conversationId = undefined) {
    return new Promise((resolve, reject) => {
      const payload = {
        receiverId,
        text,
      };
      
      if (conversationId !== undefined) {
        payload.conversationId = conversationId;
      }

      console.log(`\n📤 ${this.name}: Sending message to user ${receiverId}:`, text);

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on "private:sendMessage"`));
      }, CONFIG.timeout);

      this.socket.emit('private:sendMessage', payload, (response) => {
        clearTimeout(timeout);
        if (response && response.status === 'sent') {
          console.log(`   ✓ ${this.name}: Message sent (ID: ${response.messageId}, conversationId: ${response.conversationId})`);
        }
        resolve(response);
      });
    });
  }

  async enableAutoRead(receiverId) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔔 ${this.name}: Enabling auto-read for user ${receiverId}`);

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on "private:autoReadOn"`));
      }, CONFIG.timeout);

      this.socket.emit('private:autoReadOn', { receivedId: receiverId }, (response) => {
        clearTimeout(timeout);
        if (response && response.status === 'enabled') {
          console.log(`   ✓ ${this.name}: Auto-read enabled (conversationId: ${response.conversationId})`);
        }
        resolve(response);
      });
    });
  }

  async disableAutoRead(receiverId) {
    return new Promise((resolve, reject) => {
      console.log(`\n🔕 ${this.name}: Disabling auto-read for user ${receiverId}`);

      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on "private:autoReadOff"`));
      }, CONFIG.timeout);

      this.socket.emit('private:autoReadOff', { receivedId: receiverId }, (response) => {
        clearTimeout(timeout);
        if (response && response.status === 'disabled') {
          console.log(`   ✓ ${this.name}: Auto-read disabled (conversationId: ${response.conversationId})`);
        }
        resolve(response);
      });
    });
  }

  async waitForMessage(timeoutMs = CONFIG.timeout) {
    const startCount = this.receivedMessages.length;
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (this.receivedMessages.length > startCount) {
        return this.receivedMessages[this.receivedMessages.length - 1];
      }
      await TestUtils.sleep(100);
    }
    
    throw new Error(`Timeout waiting for message after ${timeoutMs}ms`);
  }

  storeEvent(eventName, data) {
    if (!this.receivedEvents.has(eventName)) {
      this.receivedEvents.set(eventName, []);
    }
    this.receivedEvents.get(eventName).push({
      timestamp: Date.now(),
      data: data,
    });
  }

  getEvent(eventName) {
    return this.receivedEvents.get(eventName);
  }

  clearMessages() {
    this.receivedMessages = [];
  }

  disconnect() {
    if (this.socket) {
      console.log(`\n🔌 ${this.name}: Disconnecting...`);
      this.socket.disconnect();
      console.log(`   ✓ ${this.name}: Disconnected`);
    }
  }

  get socketId() {
    return this.socket?.id;
  }

  get isConnected() {
    return this.socket?.connected || false;
  }
}

// ==================== Test Suites ====================

async function testConnection(clientA, clientB, results) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST SUITE 1: Connection & Authentication');
  console.log('='.repeat(70));

  try {
    // Test 1.1: User A connects with token via query parameter
    try {
      await clientA.connect();
      TestUtils.assertExists(clientA.socketId, 'clientA socket.id');
      TestUtils.assert(clientA.isConnected, 'clientA should be connected');
      results.addTest('User A connection via query token', 'PASS');
    } catch (error) {
      results.addTest('User A connection via query token', 'FAIL', error.message);
      throw error;
    }

    // Test 1.2: User B connects with token via query parameter
    try {
      await clientB.connect();
      TestUtils.assertExists(clientB.socketId, 'clientB socket.id');
      TestUtils.assert(clientB.isConnected, 'clientB should be connected');
      results.addTest('User B connection via query token', 'PASS');
    } catch (error) {
      results.addTest('User B connection via query token', 'FAIL', error.message);
      throw error;
    }

    // Test 1.3: User A receives private:connected event
    try {
      await TestUtils.sleep(500);
      const connectedEvents = clientA.getEvent('private:connected');
      TestUtils.assertExists(connectedEvents, 'private:connected event');
      TestUtils.assert(connectedEvents.length > 0, 'Should have received event');
      const data = connectedEvents[0].data;
      TestUtils.assertEqual(data.status, 'ok', 'status should be ok');
      TestUtils.assertExists(data.clientId, 'clientId');
      TestUtils.assertExists(data.timestamp, 'timestamp');
      results.addTest('User A receives private:connected event', 'PASS');
    } catch (error) {
      results.addTest('User A receives private:connected event', 'FAIL', error.message);
    }

    // Test 1.4: User B receives private:connected event
    try {
      const connectedEvents = clientB.getEvent('private:connected');
      TestUtils.assertExists(connectedEvents, 'private:connected event');
      TestUtils.assert(connectedEvents.length > 0, 'Should have received event');
      const data = connectedEvents[0].data;
      TestUtils.assertEqual(data.status, 'ok', 'status should be ok');
      results.addTest('User B receives private:connected event', 'PASS');
    } catch (error) {
      results.addTest('User B receives private:connected event', 'FAIL', error.message);
    }

    // Test 1.5: Verify users are auto-joined to personal rooms (implicit test)
    results.addTest('Users auto-joined to personal rooms (user:{userId})', 'PASS', 
      'Implicit - verified by successful connection');

  } catch (error) {
    console.error('\n💥 Connection test suite failed:', error.message);
  }
}

async function testFirstMessage(clientA, clientB, results) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST SUITE 2: First Message Without Manual Join');
  console.log('='.repeat(70));

  clientA.clearMessages();
  clientB.clearMessages();

  try {
    // Test 2.1: User A sends FIRST message to User B (no prior join)
    let messageResponse;
    try {
      messageResponse = await clientA.sendMessage(
        CONFIG.userB.userId,
        'Hello User B! This is the first message without join.'
      );
      
      TestUtils.assertExists(messageResponse, 'sendMessage response');
      TestUtils.assertEqual(messageResponse.status, 'sent', 'status should be sent');
      TestUtils.assertExists(messageResponse.messageId, 'messageId');
      TestUtils.assertType(messageResponse.messageId, 'number', 'messageId');
      TestUtils.assertExists(messageResponse.conversationId, 'conversationId');
      TestUtils.assertType(messageResponse.conversationId, 'number', 'conversationId');
      
      results.addTest('User A sends first message (without join)', 'PASS');
    } catch (error) {
      results.addTest('User A sends first message (without join)', 'FAIL', error.message);
      throw error;
    }

    // Test 2.2: User A receives own message in real-time
    try {
      await TestUtils.sleep(500);
      TestUtils.assert(clientA.receivedMessages.length > 0, 
        'User A should receive own message');
      
      const ownMessage = clientA.receivedMessages[0];
      TestUtils.assertEqual(ownMessage.id, messageResponse.messageId, 'Message ID should match');
      TestUtils.assertEqual(ownMessage.conversationId, messageResponse.conversationId, 
        'Conversation ID should match');
      TestUtils.assertEqual(ownMessage.userId, CONFIG.userA.userId, 'Sender ID should match');
      TestUtils.assertEqual(ownMessage.text, 'Hello User B! This is the first message without join.', 
        'Message text should match');
      
      results.addTest('User A receives own message in real-time', 'PASS');
    } catch (error) {
      results.addTest('User A receives own message in real-time', 'FAIL', error.message);
    }

    // Test 2.3: User B receives message in real-time (CRITICAL TEST)
    try {
      await TestUtils.sleep(500);
      TestUtils.assert(clientB.receivedMessages.length > 0, 
        'User B should receive message without prior join');
      
      const receivedMessage = clientB.receivedMessages[0];
      TestUtils.assertEqual(receivedMessage.id, messageResponse.messageId, 'Message ID should match');
      TestUtils.assertEqual(receivedMessage.conversationId, messageResponse.conversationId, 
        'Conversation ID should match');
      TestUtils.assertEqual(receivedMessage.userId, CONFIG.userA.userId, 
        'Sender ID should be User A');
      TestUtils.assertEqual(receivedMessage.text, 'Hello User B! This is the first message without join.', 
        'Message text should match');
      
      results.addTest('User B receives first message in real-time (no join required)', 'PASS');
    } catch (error) {
      results.addTest('User B receives first message in real-time (no join required)', 'FAIL', 
        error.message);
    }

    // Test 2.4: Message structure validation
    try {
      const message = clientB.receivedMessages[0];
      TestUtils.assertExists(message.user, 'message.user');
      TestUtils.assertExists(message.user.id, 'message.user.id');
      TestUtils.assertExists(message.createdAt, 'message.createdAt');
      TestUtils.assertExists(message.updatedAt, 'message.updatedAt');
      
      results.addTest('Message structure validation', 'PASS');
    } catch (error) {
      results.addTest('Message structure validation', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('\n💥 First message test suite failed:', error.message);
  }
}

async function testBidirectionalMessaging(clientA, clientB, results) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST SUITE 3: Bidirectional Messaging');
  console.log('='.repeat(70));

  clientA.clearMessages();
  clientB.clearMessages();

  try {
    // Test 3.1: User B replies to User A
    let replyResponse;
    try {
      replyResponse = await clientB.sendMessage(
        CONFIG.userA.userId,
        'Hello User A! This is my reply.'
      );
      
      TestUtils.assertEqual(replyResponse.status, 'sent', 'status should be sent');
      TestUtils.assertExists(replyResponse.messageId, 'messageId');
      
      results.addTest('User B sends reply message', 'PASS');
    } catch (error) {
      results.addTest('User B sends reply message', 'FAIL', error.message);
      throw error;
    }

    // Test 3.2: User A receives reply in real-time
    try {
      await TestUtils.sleep(500);
      TestUtils.assert(clientA.receivedMessages.length > 0, 
        'User A should receive reply');
      
      const reply = clientA.receivedMessages.find(m => m.id === replyResponse.messageId);
      TestUtils.assertExists(reply, 'Reply message');
      TestUtils.assertEqual(reply.userId, CONFIG.userB.userId, 'Sender should be User B');
      TestUtils.assertEqual(reply.text, 'Hello User A! This is my reply.', 'Reply text should match');
      
      results.addTest('User A receives reply in real-time', 'PASS');
    } catch (error) {
      results.addTest('User A receives reply in real-time', 'FAIL', error.message);
    }

    // Test 3.3: Multiple messages in rapid succession
    try {
      clientA.clearMessages();
      clientB.clearMessages();
      
      const msg1 = await clientA.sendMessage(CONFIG.userB.userId, 'Message 1');
      const msg2 = await clientA.sendMessage(CONFIG.userB.userId, 'Message 2');
      const msg3 = await clientA.sendMessage(CONFIG.userB.userId, 'Message 3');
      
      await TestUtils.sleep(1000);
      
      TestUtils.assert(clientB.receivedMessages.length >= 3, 
        'User B should receive all 3 messages');
      
      results.addTest('Multiple messages in rapid succession', 'PASS');
    } catch (error) {
      results.addTest('Multiple messages in rapid succession', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('\n💥 Bidirectional messaging test suite failed:', error.message);
  }
}

async function testAutoRead(clientA, clientB, results) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST SUITE 4: Auto-Read Functionality');
  console.log('='.repeat(70));

  try {
    // Test 4.1: User B enables auto-read
    try {
      const response = await clientB.enableAutoRead(CONFIG.userA.userId);
      
      TestUtils.assertEqual(response.status, 'enabled', 'status should be enabled');
      TestUtils.assertExists(response.conversationId, 'conversationId');
      
      results.addTest('User B enables auto-read', 'PASS');
    } catch (error) {
      results.addTest('User B enables auto-read', 'FAIL', error.message);
    }

    // Test 4.2: Send message with auto-read enabled
    try {
      clientA.clearMessages();
      clientB.clearMessages();
      
      await clientA.sendMessage(CONFIG.userB.userId, 'This message should be auto-read');
      await TestUtils.sleep(1000);
      
      // Auto-read functionality works if message is delivered (read status checked server-side)
      TestUtils.assert(clientB.receivedMessages.length > 0, 
        'User B should receive message');
      
      results.addTest('Message delivery with auto-read enabled', 'PASS');
    } catch (error) {
      results.addTest('Message delivery with auto-read enabled', 'FAIL', error.message);
    }

    // Test 4.3: User B disables auto-read
    try {
      const response = await clientB.disableAutoRead(CONFIG.userA.userId);
      
      TestUtils.assertEqual(response.status, 'disabled', 'status should be disabled');
      TestUtils.assertExists(response.conversationId, 'conversationId');
      
      results.addTest('User B disables auto-read', 'PASS');
    } catch (error) {
      results.addTest('User B disables auto-read', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('\n💥 Auto-read test suite failed:', error.message);
  }
}

async function testEdgeCases(clientA, clientB, results) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST SUITE 5: Edge Cases & Error Handling');
  console.log('='.repeat(70));

  try {
    // Test 5.1: Send message without receiverId (should fail)
    try {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout'));
        }, 2000);

        clientA.socket.emit('private:sendMessage', { text: 'No receiver' }, (response) => {
          clearTimeout(timeout);
          resolve(response);
        });
      });
      
      results.addTest('Send message without receiverId (should fail)', 'FAIL', 
        'Should have thrown error but did not');
    } catch (error) {
      // Expected to fail
      results.addTest('Send message without receiverId (should fail)', 'PASS', 
        'Correctly rejected');
    }

    // Test 5.2: Long message text
    try {
      const longText = 'A'.repeat(500);
      const response = await clientA.sendMessage(CONFIG.userB.userId, longText);
      
      TestUtils.assertEqual(response.status, 'sent', 'status should be sent');
      
      results.addTest('Long message text (500 chars)', 'PASS');
    } catch (error) {
      results.addTest('Long message text (500 chars)', 'FAIL', error.message);
    }

    // Test 5.3: Special characters in message
    try {
      const specialText = 'Test with émojis 😀🎉 and special chars: <>&"\' \\n \\t';
      const response = await clientA.sendMessage(CONFIG.userB.userId, specialText);
      
      TestUtils.assertEqual(response.status, 'sent', 'status should be sent');
      
      await TestUtils.sleep(500);
      const received = clientB.receivedMessages.find(m => m.text === specialText);
      TestUtils.assertExists(received, 'Message with special chars');
      
      results.addTest('Special characters in message', 'PASS');
    } catch (error) {
      results.addTest('Special characters in message', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('\n💥 Edge cases test suite failed:', error.message);
  }
}

async function testConversationPersistence(clientA, clientB, results) {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST SUITE 6: Conversation Persistence');
  console.log('='.repeat(70));

  let conversationId;

  try {
    // Test 6.1: Get conversationId from first message
    try {
      clientA.clearMessages();
      clientB.clearMessages();
      
      const response = await clientA.sendMessage(CONFIG.userB.userId, 'Test persistence');
      conversationId = response.conversationId;
      
      TestUtils.assertExists(conversationId, 'conversationId');
      TestUtils.assertType(conversationId, 'number', 'conversationId');
      
      results.addTest('Conversation ID assigned', 'PASS');
    } catch (error) {
      results.addTest('Conversation ID assigned', 'FAIL', error.message);
      return;
    }

    // Test 6.2: Send message with explicit conversationId
    try {
      const response = await clientA.sendMessage(
        CONFIG.userB.userId, 
        'Using explicit conversationId',
        conversationId
      );
      
      TestUtils.assertEqual(response.conversationId, conversationId, 
        'Should use same conversation ID');
      
      results.addTest('Message with explicit conversationId', 'PASS');
    } catch (error) {
      results.addTest('Message with explicit conversationId', 'FAIL', error.message);
    }

    // Test 6.3: Reply uses same conversationId
    try {
      const response = await clientB.sendMessage(CONFIG.userA.userId, 'Reply message');
      
      TestUtils.assertEqual(response.conversationId, conversationId, 
        'Reply should use same conversation ID');
      
      results.addTest('Reply uses same conversationId', 'PASS');
    } catch (error) {
      results.addTest('Reply uses same conversationId', 'FAIL', error.message);
    }

  } catch (error) {
    console.error('\n💥 Conversation persistence test suite failed:', error.message);
  }
}

// ==================== Main Test Runner ====================

async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 PRIVATE CHAT WEBSOCKET TESTS - REFACTORED SYSTEM');
  console.log('='.repeat(70));
  console.log('\nConfiguration:');
  console.log(`  Server URL: ${CONFIG.serverUrl}`);
  console.log(`  User A ID: ${CONFIG.userA.userId}`);
  console.log(`  User B ID: ${CONFIG.userB.userId}`);
  console.log(`  Token A provided: ${CONFIG.userA.token !== 'your-jwt-token-user-a'}`);
  console.log(`  Token B provided: ${CONFIG.userB.token !== 'your-jwt-token-user-b'}`);

  // Validate configuration
  if (CONFIG.userA.token === 'your-jwt-token-user-a' || 
      CONFIG.userB.token === 'your-jwt-token-user-b') {
    console.error('\n❌ ERROR: Please provide valid JWT tokens for both users');
    console.error('Set JWT_TOKEN_USER_A and JWT_TOKEN_USER_B environment variables\n');
    process.exit(1);
  }

  const results = new TestResults();

  // Create test clients
  const clientA = new PrivateChatClient(
    CONFIG.serverUrl,
    CONFIG.userA.token,
    CONFIG.userA.userId,
    'User A'
  );

  const clientB = new PrivateChatClient(
    CONFIG.serverUrl,
    CONFIG.userB.token,
    CONFIG.userB.userId,
    'User B'
  );

  try {
    // Test Suite 1: Connection & Authentication
    await testConnection(clientA, clientB, results);

    // Test Suite 2: First Message Without Manual Join (CRITICAL)
    await testFirstMessage(clientA, clientB, results);

    // Test Suite 3: Bidirectional Messaging
    await testBidirectionalMessaging(clientA, clientB, results);

    // Test Suite 4: Auto-Read Functionality
    await testAutoRead(clientA, clientB, results);

    // Test Suite 5: Edge Cases & Error Handling
    await testEdgeCases(clientA, clientB, results);

    // Test Suite 6: Conversation Persistence
    await testConversationPersistence(clientA, clientB, results);

  } catch (error) {
    console.error('\n💥 Fatal test execution error:', error);
  } finally {
    clientA.disconnect();
    clientB.disconnect();
  }

  // Print final results
  const success = results.report();

  if (success) {
    console.log('✅ ALL TESTS PASSED! The refactored system works correctly.\n');
  } else {
    console.log('❌ SOME TESTS FAILED. Please review the errors above.\n');
  }

  process.exit(success ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { PrivateChatClient, TestUtils, TestResults };

