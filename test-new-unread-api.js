// Test script for the new simplified unread messages API
const API_BASE = 'https://api.mestniye.ru/api';

async function testUnreadMessages(bearerToken) {
  console.log('🧪 Testing new unread messages API...');
  
  try {
    // Test the new simplified endpoint - no parameters needed
    const response = await fetch(`${API_BASE}/events/messages/unread`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Unread messages:', JSON.stringify(data, null, 2));
      
      // Validate response structure
      if (data.count && typeof data.EVENT === 'number' && typeof data.NOTIFICATION === 'number') {
        console.log('✅ Response structure is correct');
        
        const totalMessages = Object.values(data.count).reduce((sum, count) => sum + count, 0);
        const calculatedTotal = data.EVENT + data.NOTIFICATION;
        
        if (totalMessages === calculatedTotal) {
          console.log('✅ Count totals match');
        } else {
          console.log('❌ Count totals mismatch:', totalMessages, 'vs', calculatedTotal);
        }
      } else {
        console.log('❌ Invalid response structure');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Error:', response.status, errorText);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

async function testWithMultipleTokens() {
  const tokens = [
    // Add your actual Bearer tokens here
    'your_bearer_token_here',
    // 'another_user_token_here'
  ];

  for (let i = 0; i < tokens.length; i++) {
    console.log(`\n--- Testing with Token ${i + 1} ---`);
    await testUnreadMessages(tokens[i]);
  }
}

// Usage examples:

// Test with a single token
// testUnreadMessages('your_bearer_token_here');

// Test with multiple tokens (uncomment the line below)
// testWithMultipleTokens();

console.log('ℹ️  Replace "your_bearer_token_here" with actual Bearer tokens and uncomment the test calls');

module.exports = { testUnreadMessages };
