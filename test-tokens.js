const jwt = require('jsonwebtoken');

const secret = 'super-secret-jwt-key-please-change-in-production-123456789';

function generateToken(userId) {
  const payload = {
    sub: userId.toString(),
    type: 'access'
  };
  return jwt.sign(payload, secret, { expiresIn: '12h' });
}

console.log('=== TEST TOKENS ===');
console.log('User 7 token:', generateToken(7));
console.log('User 8 token:', generateToken(8));
console.log('');
console.log('=== CURL COMMANDS ===');
console.log('# Test markAsRead for User 8 (should mark messages from User 7 as read)');
console.log(`curl -X POST "http://localhost:3000/api/private-chat/conversations/100/read" \\
  -H "Authorization: Bearer ${generateToken(8)}" \\
  -H "Content-Type: application/json" \\
  -d "{}"`);
console.log('');
console.log('# Test markAsRead for User 7 (should mark messages from User 8 as read)');
console.log(`curl -X POST "http://localhost:3000/api/private-chat/conversations/100/read" \\
  -H "Authorization: Bearer ${generateToken(7)}" \\
  -H "Content-Type: application/json" \\
  -d "{}"`);
