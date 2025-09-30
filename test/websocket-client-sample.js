/**
 * Sample WebSocket Client for Testing Unified Gateways
 * 
 * This script demonstrates how to connect to and interact with
 * all three gateways (Events, CommunityChat, PrivateChat) over
 * a single WebSocket connection.
 * 
 * Usage:
 *   npm install socket.io-client
 *   node test/websocket-client-sample.js
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const JWT_TOKEN = 'your-jwt-token-here'; // Replace with valid JWT

// Test data - adjust according to your database
const TEST_DATA = {
  eventId: 1,
  communityId: 1,
  conversationId: 1,
  receiverId: 2, // Another user ID for testing
};

class WebSocketTestClient {
  constructor(url, token) {
    this.url = url;
    this.token = token;
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to the WebSocket server
   */
  connect() {
    return new Promise((resolve, reject) => {
      console.log('🔌 Connecting to', this.url);

      this.socket = io(this.url, {
        transports: ['websocket'],
        auth: {
          token: this.token,
        },
        query: {
          token: this.token,
        },
      });

      // Connection established
      this.socket.on('connect', () => {
        console.log('✅ Connected with socket ID:', this.socket.id);
        this.connected = true;
      });

      // Server confirmation
      this.socket.on('connected', (data) => {
        console.log('📡 Received "connected" event:', data);
        resolve(data);
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('❌ Connection error:', error.message);
        reject(error);
      });

      // Disconnection
      this.socket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
        this.connected = false;
      });

      // Generic error handler
      this.socket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      // Exception handler
      this.socket.on('exception', (error) => {
        console.error('❌ Server exception:', error);
      });
    });
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting...');
      this.socket.disconnect();
    }
  }

  /**
   * Emit an event and wait for acknowledgment
   */
  emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Not connected'));
        return;
      }

      console.log(`📤 Emitting "${event}":`, data);

      this.socket.emit(event, data, (response) => {
        console.log(`📥 Ack for "${event}":`, response);
        resolve(response);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error(`Timeout waiting for ack on "${event}"`));
      }, 5000);
    });
  }

  /**
   * Listen for an event (one-time)
   */
  once(event) {
    return new Promise((resolve) => {
      this.socket.once(event, (data) => {
        console.log(`📥 Received "${event}":`, data);
        resolve(data);
      });
    });
  }

  /**
   * Listen for an event (continuous)
   */
  on(event, callback) {
    this.socket.on(event, (data) => {
      console.log(`📥 Received "${event}":`, data);
      callback(data);
    });
  }

  // ==================== EventsGateway Tests ====================

  async testEventsGateway(eventId) {
    console.log('\n🎯 ===== Testing EventsGateway =====');

    try {
      // Join event
      console.log('\n📍 Test: Join Event');
      const joinAck = await this.emit('joinEvent', eventId);
      console.log('✅ Join event ack:', joinAck);

      // Listen for new messages
      this.on('newMessage', (message) => {
        console.log('💬 New event message received:', message);
      });

      // Send message
      console.log('\n📍 Test: Send Message to Event');
      const msgAck = await this.emit('sendMessage', {
        eventId: eventId,
        message: {
          text: 'Hello from test client! 🎉',
        },
      });
      console.log('✅ Send message ack:', msgAck);

      // Wait a bit to receive the broadcast
      await this.sleep(1000);

      // Leave event
      console.log('\n📍 Test: Leave Event');
      const leaveAck = await this.emit('leaveEvent', eventId);
      console.log('✅ Leave event ack:', leaveAck);

      console.log('✅ EventsGateway tests completed');
    } catch (error) {
      console.error('❌ EventsGateway test failed:', error.message);
    }
  }

  // ==================== CommunityChatGateway Tests ====================

  async testCommunityChatGateway(communityId) {
    console.log('\n🏘️  ===== Testing CommunityChatGateway =====');

    try {
      // Listen for community events
      this.once('joinedCommunity').then((data) => {
        console.log('✅ Received joinedCommunity event:', data);
      });

      this.on('communityMessage', (message) => {
        console.log('💬 New community message received:', message);
      });

      // Join community
      console.log('\n📍 Test: Join Community');
      const joinAck = await this.emit('joinCommunity', { communityId });
      console.log('✅ Join community ack:', joinAck);

      await this.sleep(500);

      // Send message to community
      console.log('\n📍 Test: Send Message to Community');
      const msgAck = await this.emit('sendMessage', {
        communityId: communityId,
        text: 'Hello, community! 👋',
      });
      console.log('✅ Send community message ack:', msgAck);

      // Wait for broadcast
      await this.sleep(1000);

      // Send reply (if you have a message to reply to)
      console.log('\n📍 Test: Reply to Community Message');
      const replyAck = await this.emit('sendMessage', {
        communityId: communityId,
        text: 'This is a reply! 💬',
        replyToMessageId: msgAck.messageId, // Reply to the message we just sent
      });
      console.log('✅ Send reply ack:', replyAck);

      await this.sleep(1000);

      console.log('✅ CommunityChatGateway tests completed');
    } catch (error) {
      console.error('❌ CommunityChatGateway test failed:', error.message);
    }
  }

  // ==================== PrivateChatGateway Tests ====================

  async testPrivateChatGateway(conversationId, receiverId) {
    console.log('\n💬 ===== Testing PrivateChatGateway =====');

    try {
      // Listen for private chat events
      this.once('identified').then((data) => {
        console.log('✅ Received identified event:', data);
      });

      this.once('joinedPrivateChat').then((data) => {
        console.log('✅ Received joinedPrivateChat event:', data);
      });

      this.on('privateMessage', (message) => {
        console.log('💬 New private message received:', message);
      });

      this.on('messagesRead', (data) => {
        console.log('👁️  Messages read notification:', data);
      });

      // Identify user
      console.log('\n📍 Test: Identify User');
      const identifyAck = await this.emit('identify');
      console.log('✅ Identify ack:', identifyAck);

      await this.sleep(500);

      // Join private chat
      console.log('\n📍 Test: Join Private Chat');
      const joinAck = await this.emit('joinPrivateChat', { conversationId });
      console.log('✅ Join private chat ack:', joinAck);

      await this.sleep(500);

      // Send message to existing conversation
      console.log('\n📍 Test: Send Message to Conversation');
      const msgAck = await this.emit('sendMessage', {
        conversationId: conversationId,
        text: 'Hello from private chat! 🔒',
      });
      console.log('✅ Send private message ack:', msgAck);

      await this.sleep(1000);

      // Send message to new conversation (by receiverId)
      console.log('\n📍 Test: Start New Conversation');
      const newConvAck = await this.emit('sendMessage', {
        receiverId: receiverId,
        text: 'Starting a new conversation! 🆕',
      });
      console.log('✅ New conversation message ack:', newConvAck);

      await this.sleep(1000);

      // Mark messages as read
      console.log('\n📍 Test: Mark Messages as Read');
      const readAck = await this.emit('markRead', {
        conversationId: conversationId,
      });
      console.log('✅ Mark read ack:', readAck);

      await this.sleep(1000);

      console.log('✅ PrivateChatGateway tests completed');
    } catch (error) {
      console.error('❌ PrivateChatGateway test failed:', error.message);
    }
  }

  // ==================== Helper Methods ====================

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ==================== Main Test Execution ====================

async function runTests() {
  console.log('🚀 Starting WebSocket Gateway Tests\n');

  const client = new WebSocketTestClient(SERVER_URL, JWT_TOKEN);

  try {
    // Connect to server
    await client.connect();
    console.log('✅ Connection established\n');

    // Wait a bit
    await client.sleep(500);

    // Test EventsGateway
    await client.testEventsGateway(TEST_DATA.eventId);

    // Test CommunityChatGateway
    await client.testCommunityChatGateway(TEST_DATA.communityId);

    // Test PrivateChatGateway
    await client.testPrivateChatGateway(
      TEST_DATA.conversationId,
      TEST_DATA.receiverId
    );

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n⏳ Keeping connection alive for 10 seconds to observe broadcasts...');
    await client.sleep(10000);
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  } finally {
    // Disconnect
    client.disconnect();
    console.log('\n👋 Test session ended');
    process.exit(0);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

// Export for use in other scripts
module.exports = { WebSocketTestClient };
