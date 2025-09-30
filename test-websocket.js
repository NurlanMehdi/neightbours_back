const { io } = require('socket.io-client');

const JWT_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjM4LCJyb2xlIjoiVVNFUiIsInBob25lIjoiNzExMTExMTExMTEiLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5MjE2OTc1LCJleHAiOjE3NTkyNjAxNzV9.XeFJAgFim5T2vFKWose9V9gsk8rR52p-m75LKxvwZ2M';

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
    socket.emit('joinCommunity', { communityId: 2 }, (ack) => {
      console.log('✅ Join community ack:', ack);
    });
  }, 1000);
  
  setTimeout(() => {
    console.log('📤 Emitting sendMessage...');
    socket.emit('sendMessage', { 
      communityId: 2, 
      text: 'Test from socket.io-client' 
    }, (ack) => {
      console.log('✅ Send message ack:', ack);
    });
  }, 2000);
});

socket.on('connected', (data) => {
  console.log('📡 Server connected event:', data);
});

socket.on('joinedCommunity', (data) => {
  console.log('✅ Joined community event:', data);
});

socket.on('communityMessage', (message) => {
  console.log('📨 New community message received:');
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
