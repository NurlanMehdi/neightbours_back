const { io } = require('socket.io-client');

// Configuration
const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsInBob25lIjoiNzk4MDAwODA5NTUiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5MjUzNTcwLCJleHAiOjE3NTkyOTY3NzB9.2LJut0TgRhXJVOZYmu6i5uCaiDvl6jc3FFawsHG50Z8';
const SERVER_URL = 'wss://api.mestniye.ru'; // Local development server

// Test data - adjust according to your database
const TEST_DATA = {
  communityId: 2, // Green Valley Neighborhood community
};

console.log('🏘️  Starting Community Chat WebSocket Tests');
console.log('=' .repeat(60));
console.log(`🔑 Using JWT Token: ${JWT_TOKEN.substring(0, 50)}...`);
console.log(`🌐 Server URL: ${SERVER_URL}`);
console.log(`🏘️  Community ID: ${TEST_DATA.communityId}`);

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

socket.on('community:connected', (data) => {
  console.log('\n✅ COMMUNITY CONNECTED EVENT:');
  console.log(JSON.stringify(data, null, 2));
  logTest('Received community:connected event', 'PASS', JSON.stringify(data));
  
  // Start testing after connection is confirmed
  setTimeout(() => runCommunityChatTests(), 1000);
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

// ==================== CommunityChatGateway Listeners ====================

socket.on('community:joined', (data) => {
  console.log('\n✅ COMMUNITY JOINED EVENT:');
  console.log(JSON.stringify(data, null, 2));
  logTest('CommunityChatGateway: Received community:joined event', 'PASS');
});

socket.on('communityMessage', (message) => {
  console.log('\n📨 COMMUNITY MESSAGE RECEIVED:');
  console.log(JSON.stringify(message, null, 2));
  logTest('CommunityChatGateway: Received communityMessage broadcast', 'PASS');
});

// ==================== Test Execution ====================

async function runCommunityChatTests() {
  console.log('\n\n🧪 RUNNING COMMUNITY CHAT TESTS');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Join Community
    await testJoinCommunity();
    
    // Wait between tests
    await sleep(2000);
    
    // Test 2: Send Message to Community
    await testSendMessage();
    
    // Wait between tests
    await sleep(2000);
    
    // Test 3: Send Reply Message
    await testSendReply();
    
    // Wait between tests
    await sleep(2000);
    
    // Test 4: Leave Community
    await testLeaveCommunity();
    
    // Wait for broadcasts then disconnect
    setTimeout(() => {
      console.log('\n🏁 Tests completed. Disconnecting...');
      socket.disconnect();
    }, 5000);
    
  } catch (error) {
    logTest('CommunityChatGateway Tests', 'FAIL', error.message);
    console.error('Error in CommunityChatGateway tests:', error);
    socket.disconnect();
  }
}

// ==================== CommunityChatGateway Tests ====================

async function testJoinCommunity() {
  console.log('\n📡 Testing Join Community');
  console.log('-' .repeat(60));
  
  return new Promise((resolve) => {
    console.log('📡 Emitting community:join...');
    socket.emit('community:join', { communityId: TEST_DATA.communityId }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'joined' && ack.communityId === TEST_DATA.communityId) {
        logTest('CommunityChatGateway: community:join', 'PASS');
      } else {
        logTest('CommunityChatGateway: community:join', 'FAIL', `Expected status "joined", got ${JSON.stringify(ack)}`);
      }
      resolve();
    });
  });
}

async function testSendMessage() {
  console.log('\n📤 Testing Send Message');
  console.log('-' .repeat(60));
  
  return new Promise((resolve) => {
    console.log('📤 Emitting community:sendMessage...');
    socket.emit('community:sendMessage', {
      communityId: TEST_DATA.communityId,
      text: 'Test community message from WebSocket test'
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'sent' && typeof ack.messageId === 'number') {
        logTest('CommunityChatGateway: community:sendMessage', 'PASS');
      } else {
        logTest('CommunityChatGateway: community:sendMessage', 'FAIL', `Expected status "sent" with messageId, got ${JSON.stringify(ack)}`);
      }
      resolve();
    });
  });
}

async function testSendReply() {
  console.log('\n💬 Testing Send Reply Message');
  console.log('-' .repeat(60));
  
  return new Promise((resolve) => {
    console.log('💬 Emitting community:sendMessage (reply)...');
    socket.emit('community:sendMessage', {
      communityId: TEST_DATA.communityId,
      text: 'This is a reply message to test threading',
      replyToMessageId: 1 // Assuming message ID 1 exists
    }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'sent') {
        logTest('CommunityChatGateway: community:sendMessage (reply)', 'PASS');
      } else {
        logTest('CommunityChatGateway: community:sendMessage (reply)', 'FAIL', `Got ${JSON.stringify(ack)}`);
      }
      resolve();
    });
  });
}

async function testLeaveCommunity() {
  console.log('\n👋 Testing Leave Community');
  console.log('-' .repeat(60));
  
  return new Promise((resolve) => {
    console.log('👋 Emitting community:leave...');
    socket.emit('community:leave', { communityId: TEST_DATA.communityId }, (ack) => {
      console.log('📥 Ack:', JSON.stringify(ack));
      if (ack && ack.status === 'left' && ack.communityId === TEST_DATA.communityId) {
        logTest('CommunityChatGateway: community:leave', 'PASS');
      } else {
        logTest('CommunityChatGateway: community:leave', 'FAIL', `Expected status "left", got ${JSON.stringify(ack)}`);
      }
      resolve();
    });
  });
}

// ==================== Helper Functions ====================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function printResults() {
  console.log('\n\n' + '=' .repeat(60));
  console.log('📊 COMMUNITY CHAT TEST RESULTS SUMMARY');
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
  
  console.log('\n👋 Community Chat test session ended');
  process.exit(results.failed === 0 ? 0 : 1);
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n🛑 Interrupted by user');
  socket.disconnect();
  printResults();
});

console.log('\nPress Ctrl+C to exit.\n');
