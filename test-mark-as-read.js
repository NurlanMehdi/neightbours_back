const jwt = require('jsonwebtoken');

const secret = 'super-secret-jwt-key-please-change-in-production-123456789';
const baseUrl = 'http://localhost:3000/api/private-chat';

function generateToken(userId) {
  const payload = {
    sub: userId.toString(),
    type: 'access'
  };
  return jwt.sign(payload, secret, { expiresIn: '12h' });
}

async function testMarkAsRead(userId, conversationId, testName) {
  console.log(`\n=== ${testName} ===`);
  
  const token = generateToken(userId);
  const url = `${baseUrl}/conversations/${conversationId}/read`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: '{}'
    });
    
    const result = await response.json();
    console.log(`✅ Response: ${JSON.stringify(result)}`);
    return result;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting markAsRead tests...\n');
  
  // Test 1: User 8 marks messages from User 7 as read
  const test1 = await testMarkAsRead(8, 100, 'User 8 reads messages from User 7 (First time)');
  
  // Test 2: User 8 calls markAsRead again (should return updated: 0)
  const test2 = await testMarkAsRead(8, 100, 'User 8 reads messages again (Should be 0)');
  
  // Test 3: User 7 marks messages from User 8 as read
  const test3 = await testMarkAsRead(7, 100, 'User 7 reads messages from User 8 (First time)');
  
  // Test 4: User 7 calls markAsRead again (should return updated: 0)
  const test4 = await testMarkAsRead(7, 100, 'User 7 reads messages again (Should be 0)');
  
  console.log('\n📊 Test Summary:');
  console.log('Test 1 (User 8 first read):', test1 ? `updated: ${test1.updated}` : 'FAILED');
  console.log('Test 2 (User 8 second read):', test2 ? `updated: ${test2.updated}` : 'FAILED');
  console.log('Test 3 (User 7 first read):', test3 ? `updated: ${test3.updated}` : 'FAILED');
  console.log('Test 4 (User 7 second read):', test4 ? `updated: ${test4.updated}` : 'FAILED');
  
  console.log('\n✅ Expected results:');
  console.log('- Test 1: updated should be 4 (messages 101, 103, 104, 106 from User 7)');
  console.log('- Test 2: updated should be 0 (no new messages)');
  console.log('- Test 3: updated should be 2 (messages 102, 105 from User 8)');
  console.log('- Test 4: updated should be 0 (no new messages)');
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ or you need to install node-fetch');
  console.log('Run: npm install node-fetch');
  process.exit(1);
}

runTests();
