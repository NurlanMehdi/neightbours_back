const { io } = require('socket.io-client');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjcsInJvbGUiOiJVU0VSIiwicGhvbmUiOiI3OTgwMDA4MDk1NSIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NTkxNjkwMzgsImV4cCI6MTc1OTIxMjIzOH0.JF1UXDM9yQy_lJdEybCR6QlLQclGulgSBiBo8EgDevA';

console.log('🚀 Connecting to WebSocket server...');

const socket = io('wss://api.mestniye.ru', {
  transports: ['websocket'],
  auth: {
    token: JWT_TOKEN
  }
});

socket.on('connect', () => {
  console.log('✅ Connected with socket ID:', socket.id);
  
  setTimeout(() => {
    console.log('📡 Emitting joinCommunity...');
    socket.emit('joinCommunity', { communityId: 2 });
  }, 1000);
  
  setTimeout(() => {
    console.log('📤 Emitting sendCommunityMessage...');
    socket.emit('sendCommunityMessage', { 
      communityId: 2, 
      text: 'Test from socket.io-client' 
    });
  }, 2000);
});

socket.on('newCommunityMessage', (message) => {
  console.log('📨 New message received:');
  console.log(JSON.stringify(message, null, 2));
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected. Reason:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  socket.disconnect();
  process.exit(0);
});

console.log('Press Ctrl+C to exit.');
