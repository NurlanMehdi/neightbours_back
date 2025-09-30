/**
 * Automated WebSocket Tests for Unified Gateways
 * 
 * This script runs automated tests for all three gateways with
 * assertions and detailed reporting.
 * 
 * Usage:
 *   npm install socket.io-client chalk
 *   node test/websocket-automated-tests.js
 */

const io = require('socket.io-client');

// Configuration
const CONFIG = {
  serverUrl: process.env.WS_SERVER_URL || 'http://localhost:3000',
  jwtToken: process.env.JWT_TOKEN || 'your-jwt-token-here',
  testData: {
    eventId: parseInt(process.env.TEST_EVENT_ID || '1'),
    communityId: parseInt(process.env.TEST_COMMUNITY_ID || '1'),
    conversationId: parseInt(process.env.TEST_CONVERSATION_ID || '1'),
    receiverId: parseInt(process.env.TEST_RECEIVER_ID || '2'),
  },
  timeout: 5000,
};

// Test Results Tracker
class TestResults {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.skipped = 0;
  }

  addTest(name, status, message = '') {
    this.tests.push({ name, status, message });
    if (status === 'PASS') this.passed++;
    if (status === 'FAIL') this.failed++;
    if (status === 'SKIP') this.skipped++;
  }

  report() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`⏭️  Skipped: ${this.skipped}`);
    console.log('='.repeat(60) + '\n');

    if (this.failed > 0) {
      console.log('Failed Tests:');
      this.tests
        .filter((t) => t.status === 'FAIL')
        .forEach((t) => {
          console.log(`  ❌ ${t.name}: ${t.message}`);
        });
      console.log('');
    }

    return this.failed === 0;
  }
}

// Test Utilities
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
    if (typeof value !== type) {
      throw new Error(
        `${fieldName} should be ${type} but is ${typeof value}`
      );
    }
  }

  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// WebSocket Test Client
class TestClient {
  constructor(url, token, timeout = 5000) {
    this.url = url;
    this.token = token;
    this.timeout = timeout;
    this.socket = null;
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        transports: ['websocket'],
        auth: { token: this.token },
        query: { token: this.token },
      });

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, this.timeout);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // Store received events for testing
      this.socket.onAny((eventName, ...args) => {
        if (!this.eventListeners.has(eventName)) {
          this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(args);
      });
    });
  }

  async emit(event, data) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on "${event}"`));
      }, this.timeout);

      this.socket.emit(event, data, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
    });
  }

  async waitForEvent(event, timeoutMs = this.timeout) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout waiting for event "${event}"`));
      }, timeoutMs);

      this.socket.once(event, (data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  get socketId() {
    return this.socket?.id;
  }
}

// ==================== Test Suites ====================

async function testConnectionLifecycle(results) {
  console.log('\n🔌 Testing Connection Lifecycle...');
  const client = new TestClient(CONFIG.serverUrl, CONFIG.jwtToken);

  try {
    // Test 1.1: Connection
    try {
      await client.connect();
      TestUtils.assertExists(client.socketId, 'socket.id');
      results.addTest('Connection established', 'PASS');
      console.log('  ✅ Connection established');
    } catch (error) {
      results.addTest('Connection established', 'FAIL', error.message);
      console.log('  ❌ Connection failed:', error.message);
      return;
    }

    // Test 1.2: Connected event
    try {
      const connectedData = await client.waitForEvent('connected', 2000);
      TestUtils.assertExists(connectedData, 'connected event data');
      TestUtils.assertEqual(connectedData.status, 'ok', 'status should be ok');
      TestUtils.assertExists(connectedData.clientId, 'clientId');
      TestUtils.assertExists(connectedData.timestamp, 'timestamp');
      results.addTest('Received connected event', 'PASS');
      console.log('  ✅ Received connected event with correct structure');
    } catch (error) {
      results.addTest('Received connected event', 'FAIL', error.message);
      console.log('  ❌ Connected event failed:', error.message);
    }

    // Test 1.3: Disconnection
    try {
      client.disconnect();
      await TestUtils.sleep(100);
      results.addTest('Clean disconnection', 'PASS');
      console.log('  ✅ Clean disconnection');
    } catch (error) {
      results.addTest('Clean disconnection', 'FAIL', error.message);
      console.log('  ❌ Disconnection failed:', error.message);
    }
  } catch (error) {
    console.error('  💥 Lifecycle test error:', error);
  }
}

async function testEventsGateway(client, results) {
  console.log('\n🎯 Testing EventsGateway...');

  // Test 2.1: Join Event
  try {
    const ack = await client.emit('joinEvent', CONFIG.testData.eventId);
    TestUtils.assertExists(ack, 'joinEvent ack');
    TestUtils.assertEqual(ack.status, 'joined', 'status should be joined');
    results.addTest('EventsGateway: joinEvent', 'PASS');
    console.log('  ✅ joinEvent works correctly');
  } catch (error) {
    results.addTest('EventsGateway: joinEvent', 'FAIL', error.message);
    console.log('  ❌ joinEvent failed:', error.message);
  }

  // Test 2.2: Send Message
  try {
    const ack = await client.emit('sendMessage', {
      eventId: CONFIG.testData.eventId,
      message: { text: 'Test message' },
    });
    TestUtils.assertExists(ack, 'sendMessage ack');
    TestUtils.assertExists(ack.id, 'message.id');
    TestUtils.assertExists(ack.text, 'message.text');
    results.addTest('EventsGateway: sendMessage', 'PASS');
    console.log('  ✅ sendMessage works correctly');

    // Wait for broadcast
    await TestUtils.sleep(500);
  } catch (error) {
    results.addTest('EventsGateway: sendMessage', 'FAIL', error.message);
    console.log('  ❌ sendMessage failed:', error.message);
  }

  // Test 2.3: Leave Event
  try {
    const ack = await client.emit('leaveEvent', CONFIG.testData.eventId);
    TestUtils.assertExists(ack, 'leaveEvent ack');
    TestUtils.assertEqual(ack.status, 'left', 'status should be left');
    results.addTest('EventsGateway: leaveEvent', 'PASS');
    console.log('  ✅ leaveEvent works correctly');
  } catch (error) {
    results.addTest('EventsGateway: leaveEvent', 'FAIL', error.message);
    console.log('  ❌ leaveEvent failed:', error.message);
  }
}

async function testCommunityChatGateway(client, results) {
  console.log('\n🏘️  Testing CommunityChatGateway...');

  // Test 3.1: Join Community
  try {
    const eventPromise = client.waitForEvent('joinedCommunity', 2000);
    const ack = await client.emit('joinCommunity', {
      communityId: CONFIG.testData.communityId,
    });

    TestUtils.assertExists(ack, 'joinCommunity ack');
    TestUtils.assertEqual(ack.status, 'joined', 'status should be joined');
    TestUtils.assertEqual(
      ack.communityId,
      CONFIG.testData.communityId,
      'communityId should match'
    );
    results.addTest('CommunityChatGateway: joinCommunity ack', 'PASS');
    console.log('  ✅ joinCommunity ack correct');

    // Check for event
    const eventData = await eventPromise;
    TestUtils.assertEqual(
      eventData.communityId,
      CONFIG.testData.communityId,
      'event communityId should match'
    );
    results.addTest('CommunityChatGateway: joinedCommunity event', 'PASS');
    console.log('  ✅ joinedCommunity event received');
  } catch (error) {
    results.addTest('CommunityChatGateway: joinCommunity', 'FAIL', error.message);
    console.log('  ❌ joinCommunity failed:', error.message);
  }

  // Test 3.2: Send Message
  try {
    const eventPromise = client.waitForEvent('communityMessage', 2000);
    const ack = await client.emit('sendMessage', {
      communityId: CONFIG.testData.communityId,
      text: 'Test community message',
    });

    TestUtils.assertExists(ack, 'sendMessage ack');
    TestUtils.assertEqual(ack.status, 'sent', 'status should be sent');
    TestUtils.assertExists(ack.messageId, 'messageId should exist');
    TestUtils.assertType(ack.messageId, 'number', 'messageId');
    results.addTest('CommunityChatGateway: sendMessage ack', 'PASS');
    console.log('  ✅ sendMessage ack correct');

    // Check for broadcast
    const message = await eventPromise;
    TestUtils.assertExists(message.id, 'message.id');
    TestUtils.assertEqual(message.id, ack.messageId, 'messageId should match');
    results.addTest('CommunityChatGateway: communityMessage event', 'PASS');
    console.log('  ✅ communityMessage broadcast received');
  } catch (error) {
    results.addTest('CommunityChatGateway: sendMessage', 'FAIL', error.message);
    console.log('  ❌ sendMessage failed:', error.message);
  }
}

async function testPrivateChatGateway(client, results) {
  console.log('\n💬 Testing PrivateChatGateway...');

  // Test 4.1: Identify
  try {
    const eventPromise = client.waitForEvent('identified', 2000);
    const ack = await client.emit('identify');

    TestUtils.assertExists(ack, 'identify ack');
    TestUtils.assertEqual(ack.status, 'ok', 'status should be ok');
    results.addTest('PrivateChatGateway: identify ack', 'PASS');
    console.log('  ✅ identify ack correct');

    // Check for event
    const eventData = await eventPromise;
    TestUtils.assertExists(eventData.userId, 'userId should exist');
    results.addTest('PrivateChatGateway: identified event', 'PASS');
    console.log('  ✅ identified event received');
  } catch (error) {
    results.addTest('PrivateChatGateway: identify', 'FAIL', error.message);
    console.log('  ❌ identify failed:', error.message);
  }

  // Test 4.2: Join Private Chat
  try {
    const eventPromise = client.waitForEvent('joinedPrivateChat', 2000);
    const ack = await client.emit('joinPrivateChat', {
      conversationId: CONFIG.testData.conversationId,
    });

    TestUtils.assertExists(ack, 'joinPrivateChat ack');
    TestUtils.assertEqual(ack.status, 'joined', 'status should be joined');
    TestUtils.assertEqual(
      ack.chatId,
      CONFIG.testData.conversationId,
      'chatId should match'
    );
    results.addTest('PrivateChatGateway: joinPrivateChat ack', 'PASS');
    console.log('  ✅ joinPrivateChat ack correct');

    // Check for event
    const eventData = await eventPromise;
    TestUtils.assertEqual(
      eventData.chatId,
      CONFIG.testData.conversationId,
      'event chatId should match'
    );
    results.addTest('PrivateChatGateway: joinedPrivateChat event', 'PASS');
    console.log('  ✅ joinedPrivateChat event received');
  } catch (error) {
    results.addTest('PrivateChatGateway: joinPrivateChat', 'FAIL', error.message);
    console.log('  ❌ joinPrivateChat failed:', error.message);
  }

  // Test 4.3: Send Private Message
  try {
    const eventPromise = client.waitForEvent('privateMessage', 2000);
    const ack = await client.emit('sendMessage', {
      conversationId: CONFIG.testData.conversationId,
      text: 'Test private message',
    });

    TestUtils.assertExists(ack, 'sendMessage ack');
    TestUtils.assertEqual(ack.status, 'sent', 'status should be sent');
    TestUtils.assertExists(ack.messageId, 'messageId should exist');
    results.addTest('PrivateChatGateway: sendMessage ack', 'PASS');
    console.log('  ✅ sendMessage ack correct');

    // Check for broadcast
    const message = await eventPromise;
    TestUtils.assertExists(message.id, 'message.id');
    TestUtils.assertEqual(message.id, ack.messageId, 'messageId should match');
    results.addTest('PrivateChatGateway: privateMessage event', 'PASS');
    console.log('  ✅ privateMessage broadcast received');
  } catch (error) {
    results.addTest('PrivateChatGateway: sendMessage', 'FAIL', error.message);
    console.log('  ❌ sendMessage failed:', error.message);
  }

  // Test 4.4: Mark Read
  try {
    const eventPromise = client.waitForEvent('messagesRead', 2000);
    const ack = await client.emit('markRead', {
      conversationId: CONFIG.testData.conversationId,
    });

    TestUtils.assertExists(ack, 'markRead ack');
    TestUtils.assertEqual(ack.success, true, 'success should be true');
    results.addTest('PrivateChatGateway: markRead ack', 'PASS');
    console.log('  ✅ markRead ack correct');

    // Check for broadcast
    const readData = await eventPromise;
    TestUtils.assertExists(readData.conversationId, 'conversationId');
    TestUtils.assertExists(readData.userId, 'userId');
    TestUtils.assertExists(readData.readAt, 'readAt');
    results.addTest('PrivateChatGateway: messagesRead event', 'PASS');
    console.log('  ✅ messagesRead broadcast received');
  } catch (error) {
    results.addTest('PrivateChatGateway: markRead', 'FAIL', error.message);
    console.log('  ❌ markRead failed:', error.message);
  }
}

// ==================== Main Test Runner ====================

async function runAllTests() {
  console.log('🚀 Starting Automated WebSocket Tests');
  console.log('Configuration:', {
    serverUrl: CONFIG.serverUrl,
    hasToken: !!CONFIG.jwtToken && CONFIG.jwtToken !== 'your-jwt-token-here',
    testData: CONFIG.testData,
  });

  const results = new TestResults();

  // Test 1: Connection Lifecycle
  await testConnectionLifecycle(results);

  // Create main test client
  const client = new TestClient(CONFIG.serverUrl, CONFIG.jwtToken);

  try {
    await client.connect();
    console.log('\n✅ Main test client connected');

    // Wait for connected event
    await client.waitForEvent('connected', 2000);

    // Test 2: EventsGateway
    await testEventsGateway(client, results);

    // Test 3: CommunityChatGateway
    await testCommunityChatGateway(client, results);

    // Test 4: PrivateChatGateway
    await testPrivateChatGateway(client, results);
  } catch (error) {
    console.error('\n💥 Test execution error:', error);
  } finally {
    client.disconnect();
  }

  // Print results
  const success = results.report();

  process.exit(success ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { TestClient, TestUtils, TestResults };
