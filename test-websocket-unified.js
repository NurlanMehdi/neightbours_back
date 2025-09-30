const { io } = require('socket.io-client');

// Configuration
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjM4LCJyb2xlIjoiVVNFUiIsInBob25lIjoiNzExMTExMTExMTEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5MjE2OTc1LCJleHAiOjE3NTkyNjAxNzV9.XeFJAgFim5T2vFKWose9V9gsk8rR52p-m75LKxvwZ2M';
const SERVER_URL = 'wss://api.mestniye.ru';

// Test data - adjust according to your database
const TEST_DATA = {
  eventId: 1,
  communityId: 2,
  conversationId: 1,
  receiverId: 7, // Another user ID
};

console.log('🚀 Starting WebSocket Unified Gateway Tests');
console.log('=' .repeat(60));

const socket = io(SERVER_URL, {
  transports: ['websocket'],
  auth: {
    token: JWT_TOKEN
  }
});

// Track test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, status, details = '') {
  const emoji = status === 'PASS' ? '✅' : '❌';
  console.log(`${emoji} ${name}${details ? ': ' + details : ''}`);
  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else results.failed++;
}

// ==================== Connection Lifecycle ====================

socket.on('connect', () => {
  console.log('\n🔌 CONNECTION');
  console.log('=' .repeat(60));
  logTest('Socket connected', 'PASS', `Socket ID: ${socket.id}`);
});

socket.on('connected', (data) => {
  logTest('Received connected event', 'PASS', JSON.stringify(data));
  
  // Start testing after connection is confirmed
  setTimeout(() => runTests(), 1000);
});

socket.on('connect_error', (error) => {
  logTest('Connection', 'FAIL', error.message);
  console.error('❌ Connection error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('\n🔌 Disconnected:', reason);
  printResults();
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('exception', (error) => {
  console.error('❌ Server exception:', error);
});

// ==================== EventsGateway Listeners ====================

socket.on('newMessage', (message) => {
  console.log('\n📨 EVENT MESSAGE RECEIVED:');
  console.log(JSON.stringify(message, null, 2));
  logTest('EventsGateway: Received newMessage broadcast', 'PASS');
});

// ==================== CommunityChatGateway Listeners ====================

socket.on('joinedCommunity', (data) => {
  console.log('\n✅ JOINED COMMUNITY EVENT:');
  console.log(JSON.stringify(data, null, 2));
  logTest('CommunityChatGateway: Received joinedCommunity event', 'PASS');
});

socket.on('communityMessage', (message) => {
  console.log('\n📨 COMMUNITY MESSAGE RECEIVED:');
  console.log(JSON.stringify(message, null, 2));
  logTest('CommunityChatGateway: Received communityMessage broadcast', 'PASS');
});

// ==================== PrivateChatGateway Listeners ====================

socket.on('identified', (data) => {
  console.log('\n✅ IDENTIFIED EVENT:');
  console.log(JSON.stringify(data, null, 2));
  logTest('PrivateChatGateway: Received identified event', 'PASS');
});

socket.on('joinedPrivateChat', (data) => {
  console.log('\n✅ JOINED PRIVATE CHAT EVENT:');
  console.log(JSON.stringify(data, null, 2));
  logTest('PrivateChatGateway: Received joinedPrivateChat event', 'PASS');
});

socket.on('privateMessage', (message) => {
  console.log('\n📨 PRIVATE MESSAGE RECEIVED:');
  console.log(JSON.stringify(message, null, 2));
  logTest('PrivateChatGateway: Received privateMessage broadcast', 'PASS');
});

socket.on('messagesRead', (data) => {
  console.log('\n👁️  MESSAGES READ EVENT:');
  console.log(JSON.stringify(data, null, 2));
  logTest('PrivateChatGateway: Received messagesRead event', 'PASS');
});

// ==================== Test Execution ====================

async function runTests() {
  console.log('\n\n🧪 RUNNING TESTS');
  console.log('=' .repeat(60));
  
  // Test 1: EventsGateway
  await testEventsGateway();
  
  // Wait between tests
  await sleep(2000);
  
  // Test 2: CommunityChatGateway
  await testCommunityChatGateway();
  
  // Wait between tests
  await sleep(2000);
  
  // Test 3: PrivateChatGateway
  await testPrivateChatGateway();
  
  // Wait for broadcasts then disconnect
  setTimeout(() => {
    console.log('\n🏁 Tests completed. Disconnecting...');
    socket.disconnect();
  }, 5000);
}

// ==================== EventsGateway Tests ====================

async function testEventsGateway() {
  console.log('\n🎯 Testing EventsGateway');
  console.log('-' .repeat(60));
  
  try {
    // Test 1.1: Join Event
    console.log('📡 Emitting joinEvent...');
    socket.emit('joinEvent', TEST_DATA.eventId, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'joined') {
        logTest('EventsGateway: joinEvent', 'PASS');
      } else {
        logTest('EventsGateway: joinEvent', 'FAIL', `Expected status "joined", got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 1.2: Send Message to Event
    console.log('📤 Emitting sendMessage to event...');
    socket.emit('sendMessage', {
      eventId: TEST_DATA.eventId,
      message: {
        text: 'Test message from unified socket'
      }
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.id) {
        logTest('EventsGateway: sendMessage', 'PASS');
      } else {
        logTest('EventsGateway: sendMessage', 'FAIL', `Expected message object, got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 1.3: Leave Event
    console.log('👋 Emitting leaveEvent...');
    socket.emit('leaveEvent', TEST_DATA.eventId, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'left') {
        logTest('EventsGateway: leaveEvent', 'PASS');
      } else {
        logTest('EventsGateway: leaveEvent', 'FAIL', `Expected status "left", got ${JSON.stringify(ack)}`);
      }
    });
    
  } catch (error) {
    logTest('EventsGateway', 'FAIL', error.message);
    console.error('Error in EventsGateway tests:', error);
  }
}

// ==================== CommunityChatGateway Tests ====================

async function testCommunityChatGateway() {
  console.log('\n🏘️  Testing CommunityChatGateway');
  console.log('-' .repeat(60));
  
  try {
    // Test 2.1: Join Community
    console.log('📡 Emitting joinCommunity...');
    socket.emit('joinCommunity', { communityId: TEST_DATA.communityId }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'joined' && ack.communityId === TEST_DATA.communityId) {
        logTest('CommunityChatGateway: joinCommunity', 'PASS');
      } else {
        logTest('CommunityChatGateway: joinCommunity', 'FAIL', `Expected status "joined", got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 2.2: Send Message to Community
    console.log('📤 Emitting sendMessage to community...');
    socket.emit('sendMessage', {
      communityId: TEST_DATA.communityId,
      text: 'Test community message from unified socket'
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'sent' && typeof ack.messageId === 'number') {
        logTest('CommunityChatGateway: sendMessage', 'PASS');
      } else {
        logTest('CommunityChatGateway: sendMessage', 'FAIL', `Expected status "sent" with messageId, got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 2.3: Send Reply
    console.log('💬 Emitting sendMessage (reply) to community...');
    socket.emit('sendMessage', {
      communityId: TEST_DATA.communityId,
      text: 'This is a reply message',
      replyToMessageId: 1 // Assuming message ID 1 exists
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'sent') {
        logTest('CommunityChatGateway: sendMessage (reply)', 'PASS');
      } else {
        logTest('CommunityChatGateway: sendMessage (reply)', 'FAIL', `Got ${JSON.stringify(ack)}`);
      }
    });
    
  } catch (error) {
    logTest('CommunityChatGateway', 'FAIL', error.message);
    console.error('Error in CommunityChatGateway tests:', error);
  }
}

// ==================== PrivateChatGateway Tests ====================

async function testPrivateChatGateway() {
  console.log('\n💬 Testing PrivateChatGateway');
  console.log('-' .repeat(60));
  
  try {
    // Test 3.1: Identify
    console.log('👤 Emitting identify...');
    socket.emit('identify', (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'ok') {
        logTest('PrivateChatGateway: identify', 'PASS');
      } else {
        logTest('PrivateChatGateway: identify', 'FAIL', `Expected status "ok", got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 3.2: Join Private Chat
    console.log('📡 Emitting joinPrivateChat...');
    socket.emit('joinPrivateChat', { conversationId: TEST_DATA.conversationId }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'joined' && ack.chatId === TEST_DATA.conversationId) {
        logTest('PrivateChatGateway: joinPrivateChat', 'PASS');
      } else {
        logTest('PrivateChatGateway: joinPrivateChat', 'FAIL', `Expected status "joined", got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 3.3: Send Private Message (existing conversation)
    console.log('📤 Emitting sendMessage to private chat...');
    socket.emit('sendMessage', {
      conversationId: TEST_DATA.conversationId,
      text: 'Test private message from unified socket'
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'sent' && typeof ack.messageId === 'number') {
        logTest('PrivateChatGateway: sendMessage (existing)', 'PASS');
      } else {
        logTest('PrivateChatGateway: sendMessage (existing)', 'FAIL', `Got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 3.4: Send Private Message (new conversation)
    console.log('📤 Emitting sendMessage to new conversation...');
    socket.emit('sendMessage', {
      receiverId: TEST_DATA.receiverId,
      text: 'Starting a new conversation!'
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'sent' && typeof ack.messageId === 'number') {
        logTest('PrivateChatGateway: sendMessage (new conversation)', 'PASS');
      } else {
        logTest('PrivateChatGateway: sendMessage (new conversation)', 'FAIL', `Got ${JSON.stringify(ack)}`);
      }
    });
    
    await sleep(1000);
    
    // Test 3.5: Mark as Read
    console.log('👁️  Emitting markRead...');
    socket.emit('markRead', {
      conversationId: TEST_DATA.conversationId
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.success === true) {
        logTest('PrivateChatGateway: markRead', 'PASS');
      } else {
        logTest('PrivateChatGateway: markRead', 'FAIL', `Expected success: true, got ${JSON.stringify(ack)}`);
      }
    });
    
  } catch (error) {
    logTest('PrivateChatGateway', 'FAIL', error.message);
    console.error('Error in PrivateChatGateway tests:', error);
  }
}

// ==================== Helper Functions ====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printResults() {
  console.log('\n\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log('=' .repeat(60));
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => {
        console.log(`  • ${t.name}: ${t.details}`);
      });
  }
  
  console.log('\n👋 Test session ended');
  process.exit(results.failed === 0 ? 0 : 1);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Interrupted by user');
  socket.disconnect();
  printResults();
});

console.log('\nPress Ctrl+C to exit.\n');
