// test-private-chat.js
const { io } = require('socket.io-client');

// ============================================
// Configuration - Replace these values
// ============================================
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsInJvbGUiOiJBRE1JTiIsInBob25lIjoiNzc3Nzc3Nzc3NzciLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzU5MTc4OTI4LCJleHAiOjE3NTkyMjIxMjh9.8mKvO2fxaM_q0MQ0rrODyoSq7Yh7YAuPfpiJKu6GNUU";
const receiverId = 8;

// ============================================
// Socket.IO Client Setup
// ============================================
const socket = io('wss://api.mestniye.ru/private-chat', {
  auth: {
    token: token
  },
  transports: ['websocket'],
  reconnection: false
});

let conversationId = null;

// ============================================
// Event Listeners
// ============================================

socket.on('connect', () => {
  console.log('✅ Connected to PrivateChatGateway');
  console.log(`📡 Socket ID: ${socket.id}\n`);

  // Step 1: Identify
  console.log('🔐 Step 1: Identifying user...');
  socket.emit('identify', {}, (response) => {
    console.log('✅ Identify response:', response);
    console.log('');

    // Step 2: Send first message (auto-create conversation)
    console.log('📨 Step 2: Sending first message (auto-create conversation)...');
    console.log(`   → receiverId: ${receiverId}`);
    console.log(`   → text: "Привет! Это тестовое сообщение"\n`);
    
    socket.emit('sendPrivateMessage', {
      receiverId: receiverId,
      text: 'Привет! Это тестовое сообщение'
    }, (messageResponse) => {
      console.log('✅ First message sent (conversation auto-created):');
      console.log('   Message ID:', messageResponse.id);
      console.log('   Conversation ID:', messageResponse.conversationId);
      console.log('   Sender:', messageResponse.sender?.firstName, messageResponse.sender?.lastName);
      console.log('   Text:', messageResponse.text);
      console.log('');

      conversationId = messageResponse.conversationId;

      // Step 3: Join the conversation
      console.log('🔗 Step 3: Joining conversation...');
      socket.emit('joinConversation', {
        conversationId: conversationId
      }, (joinResponse) => {
        console.log('✅ Joined conversation:', joinResponse);
        console.log('');

        // Step 4: Send another message in the same conversation
        console.log('📨 Step 4: Sending second message to existing conversation...');
        console.log(`   → conversationId: ${conversationId}`);
        console.log(`   → text: "Это второе сообщение в том же диалоге"\n`);
        
        socket.emit('sendPrivateMessage', {
          conversationId: conversationId,
          text: 'Это второе сообщение в том же диалоге'
        }, (secondMessageResponse) => {
          console.log('✅ Second message sent:');
          console.log('   Message ID:', secondMessageResponse.id);
          console.log('   Conversation ID:', secondMessageResponse.conversationId);
          console.log('   Text:', secondMessageResponse.text);
          console.log('');

          // Step 5: Send a message with receiverId (should use existing conversation)
          console.log('📨 Step 5: Sending message via receiverId (should use existing conversation)...');
          socket.emit('sendPrivateMessage', {
            receiverId: receiverId,
            text: 'Третье сообщение через receiverId'
          }, (thirdMessageResponse) => {
            console.log('✅ Third message sent via receiverId:');
            console.log('   Message ID:', thirdMessageResponse.id);
            console.log('   Conversation ID:', thirdMessageResponse.conversationId);
            console.log('   Same conversation?', thirdMessageResponse.conversationId === conversationId ? '✅ Yes' : '❌ No');
            console.log('');

            // Step 6: Mark messages as read
            console.log('📖 Step 6: Marking messages as read...');
            socket.emit('markRead', {
              conversationId: conversationId
            }, (markReadResponse) => {
              console.log('✅ Messages marked as read:', markReadResponse);
              console.log('');

              console.log('✅ All tests completed successfully!');
              console.log('🛑 Disconnecting in 2 seconds...\n');
              
              setTimeout(() => {
                socket.disconnect();
              }, 2000);
            });
          });
        });
      });
    });
  });
});

socket.on('connected', (data) => {
  console.log('📡 Server connected event:', data);
});

socket.on('newPrivateMessage', (message) => {
  console.log('📬 New private message received:');
  console.log('   Message ID:', message.id);
  console.log('   Conversation ID:', message.conversationId);
  console.log('   Sender:', message.sender?.firstName, message.sender?.lastName);
  console.log('   Text:', message.text);
  console.log('');
});

socket.on('messagesRead', (data) => {
  console.log('📖 Messages read event:');
  console.log('   Conversation ID:', data.conversationId);
  console.log('   User ID:', data.userId);
  console.log('   Read At:', data.readAt);
  console.log('');
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('disconnect', (reason) => {
  console.log(`🛑 Disconnected: ${reason}\n`);
  process.exit(0);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.error('   Make sure:');
  console.error('   1. Your JWT token is valid');
  console.error('   2. The server is running');
  console.error('   3. The receiverId exists');
  process.exit(1);
});

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, closing connection...');
  socket.disconnect();
  process.exit(0);
});

console.log('🚀 Starting PrivateChatGateway test...');
console.log('🔗 Connecting to wss://api.mestniye.ru/private-chat');
console.log('⏳ Waiting for connection...\n');
