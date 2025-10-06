# Testing Private Chat WebSocket in Postman

## 📋 Prerequisites

1. **Postman Desktop** (version 10.18 or later with WebSocket support)
2. **Server running** on `http://localhost:3000`
3. **JWT tokens** for two test users

---

## 🚀 Quick Start Guide

### Step 1: Get JWT Tokens

First, get JWT tokens for two users using Postman REST API:

#### Request 1: Login User A
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "phone": "+79097844503",
  "password": "your-password"
}
```

**Copy the `accessToken` from response**

#### Request 2: Login User B
```http
POST http://localhost:3000/auth/login
Content-Type: application/json

{
  "phone": "+79097844504",
  "password": "your-password"
}
```

**Copy the `accessToken` from response**

---

### Step 2: Connect User A via WebSocket

1. **Click "New" → "WebSocket"** in Postman
2. **Enter URL with token as query parameter**:
   ```
   ws://localhost:3000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   
3. **Click "Connect"**

4. **You should see connection confirmation**:
   ```json
   {
     "status": "ok",
     "clientId": "abc123...",
     "timestamp": "2025-10-06T17:33:42.063Z"
   }
   ```

---

### Step 3: Connect User B via WebSocket

1. **Open another WebSocket tab** (File → New Tab → WebSocket)
2. **Enter URL with User B's token**:
   ```
   ws://localhost:3000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Click "Connect"**

Now you have **both users connected**! 🎉

---

## 📨 Step 4: Send Messages

### Send Message from User A to User B

In **User A's WebSocket tab**, send this message:

#### Message Format (Socket.IO Protocol):
```
42["private:sendMessage",{"receiverId":3,"text":"Hello from User A!"}]
```

**Important**: Socket.IO uses a specific protocol format:
- `42` = message event
- First item in array = event name
- Second item = payload object

#### Expected Response in User A's tab:
```json
43["private:message",{
  "id": 50,
  "conversationId": 9,
  "userId": 2,
  "text": "Hello from User A!",
  "createdAt": "2025-10-06T17:35:00.000Z",
  "user": {
    "id": 2,
    "firstName": "User",
    "lastName": "A",
    "avatar": null
  }
}]
```

#### Expected Response in User B's tab:
```json
42["private:message",{
  "id": 50,
  "conversationId": 9,
  "userId": 2,
  "text": "Hello from User A!",
  "createdAt": "2025-10-06T17:35:00.000Z",
  "user": {
    "id": 2,
    "firstName": "User",
    "lastName": "A",
    "avatar": null
  }
}]
```

✅ **Both users receive the message in real-time!**

---

### Send Reply from User B to User A

In **User B's WebSocket tab**, send:

```
42["private:sendMessage",{"receiverId":2,"text":"Hello back from User B!"}]
```

✅ **Both users will receive this message too!**

---

## 🔧 Complete Message Examples

### 1. Send Simple Message
```
42["private:sendMessage",{"receiverId":3,"text":"Hello!"}]
```

### 2. Send Message with Explicit Conversation ID
```
42["private:sendMessage",{"receiverId":3,"conversationId":9,"text":"Using conversationId"}]
```

### 3. Send Message with Reply
```
42["private:sendMessage",{"receiverId":3,"text":"This is a reply","replyToMessageId":50}]
```

### 4. Enable Auto-Read
```
42["private:autoReadOn",{"receivedId":3}]
```

### 5. Disable Auto-Read
```
42["private:autoReadOff",{"receivedId":3}]
```

---

## 📊 Understanding Socket.IO Protocol in Postman

Socket.IO uses a special packet format. Here's what you need to know:

### Message Format
```
<packet_type><packet_id>[<event_name>,<payload>]
```

### Common Packet Types:
- `0` = CONNECT
- `1` = DISCONNECT
- `2` = EVENT
- `3` = ACK
- `4` = ERROR
- `40` = CONNECT (with namespace)
- `41` = DISCONNECT (with namespace)
- `42` = EVENT (with ack)
- `43` = ACK

### Examples:

**Sending an event** (from client):
```
42["private:sendMessage",{"receiverId":3,"text":"Hello"}]
```

**Receiving an event** (from server):
```
42["private:message",{"id":1,"text":"Hello","userId":2}]
```

**Receiving ACK** (acknowledgment):
```
430[{"status":"sent","messageId":1,"conversationId":9}]
```

---

## 🎯 Complete Testing Workflow in Postman

### Test Scenario: Complete Chat Flow

1. **Open TWO WebSocket tabs** (one for each user)

2. **Tab 1 (User A)**: Connect
   ```
   ws://localhost:3000?token=USER_A_TOKEN
   ```

3. **Tab 2 (User B)**: Connect
   ```
   ws://localhost:3000?token=USER_B_TOKEN
   ```

4. **Wait for connection events** in both tabs:
   ```json
   Event: "private:connected"
   ```

5. **User A sends first message**:
   ```
   42["private:sendMessage",{"receiverId":3,"text":"First message without join!"}]
   ```

6. **Verify in User A's tab**: Message appears
7. **Verify in User B's tab**: Message appears ✅ **This is the critical test!**

8. **User B replies**:
   ```
   42["private:sendMessage",{"receiverId":2,"text":"Reply from User B"}]
   ```

9. **Verify both users receive the reply**

10. **User B enables auto-read**:
    ```
    42["private:autoReadOn",{"receivedId":2}]
    ```

11. **User A sends another message** - should be auto-read by User B

---

## 🐛 Troubleshooting

### Problem: Connection Fails

**Symptoms**: Can't connect to WebSocket

**Solutions**:
```
✓ Check server is running: curl http://localhost:3000
✓ Verify WebSocket URL: ws://localhost:3000?token=...
✓ Ensure token is in query parameter (not header)
✓ Token should not be expired
✓ Use ws:// not wss:// for localhost
```

### Problem: "Invalid token" or immediate disconnect

**Symptoms**: Connects then immediately disconnects

**Solutions**:
```
✓ Verify token is valid (not expired)
✓ Token must be in query string: ?token=YOUR_TOKEN
✓ Get fresh token from login API
✓ Check JWT_SECRET in server .env
```

### Problem: Messages not received

**Symptoms**: Send message but other user doesn't receive it

**Solutions**:
```
✓ Verify both users are connected
✓ Check receiverId matches the other user's ID
✓ Ensure Socket.IO message format is correct: 42["eventName",{payload}]
✓ Look for error events in Postman messages tab
```

### Problem: Cannot see received messages

**Symptoms**: Sent messages but can't see responses

**Solutions**:
```
✓ Keep WebSocket connection open
✓ Look in "Messages" tab in Postman (not "Response")
✓ Scroll down in messages list
✓ Check server logs for errors
```

---

## 💡 Pro Tips for Postman WebSocket Testing

### Tip 1: Use Collections
Create a Postman collection with:
- Login User A (REST)
- Login User B (REST)
- Connect User A (WebSocket)
- Connect User B (WebSocket)
- Sample messages

### Tip 2: Use Variables
```javascript
// In Postman environment:
{
  "server_url": "http://localhost:3000",
  "ws_url": "ws://localhost:3000",
  "user_a_token": "{{user_a_token}}",
  "user_b_token": "{{user_b_token}}",
  "user_a_id": "2",
  "user_b_id": "3"
}
```

Then use:
```
ws://{{server_url}}?token={{user_a_token}}
```

### Tip 3: Save Common Messages
Create a list of common message templates:
```
// Simple message
42["private:sendMessage",{"receiverId":{{user_b_id}},"text":"Test message"}]

// With conversation ID
42["private:sendMessage",{"receiverId":{{user_b_id}},"conversationId":9,"text":"Test"}]

// Auto-read on
42["private:autoReadOn",{"receivedId":{{user_b_id}}}]
```

### Tip 4: Monitor Both Tabs Side-by-Side
- Split your screen
- Put User A's tab on left
- Put User B's tab on right
- Watch messages appear in real-time!

### Tip 5: Use Postman Console
```
View → Show Postman Console
```
This shows all WebSocket frames and helps debug issues.

---

## 📸 Visual Guide

### Step-by-Step Screenshots Description:

#### 1. Create New WebSocket Request
```
New → WebSocket Request
Name it: "Private Chat - User A"
```

#### 2. Configure Connection
```
URL: ws://localhost:3000?token=YOUR_TOKEN_HERE
```

#### 3. Connect
```
Click "Connect" button
Status should show: "Connected"
```

#### 4. View Connection Event
```
Messages tab shows:
↓ Received: 42["private:connected",{"status":"ok",...}]
```

#### 5. Send Message
```
In "Message" input box, paste:
42["private:sendMessage",{"receiverId":3,"text":"Hello!"}]

Click "Send"
```

#### 6. View Response
```
Messages tab shows:
↓ Received: 42["private:message",{"id":50,...}]
```

---

## 🔍 Debugging Messages in Postman

### Enable Raw WebSocket Frames
1. Click on connection name
2. Settings → Show raw messages
3. Now you see actual WebSocket frames

### Message Types You'll See:

**Connection:**
```
↑ Sent: 0{"token":"..."}
↓ Received: 0{"sid":"abc123"}
```

**Ping/Pong:**
```
↓ Received: 2
↑ Sent: 3
```

**Events:**
```
↑ Sent: 42["private:sendMessage",{...}]
↓ Received: 43[{"status":"sent",...}]
↓ Received: 42["private:message",{...}]
```

---

## ✅ Testing Checklist

Use this checklist to verify everything works:

- [ ] User A connects successfully
- [ ] User B connects successfully
- [ ] Both users receive `private:connected` event
- [ ] User A sends message to User B
- [ ] User A receives own message (echo)
- [ ] User B receives message from User A ⭐ **CRITICAL**
- [ ] User B sends reply to User A
- [ ] Both users receive the reply
- [ ] Messages have correct structure (id, conversationId, userId, text, user object)
- [ ] ConversationId is consistent across messages
- [ ] Auto-read enable works
- [ ] Auto-read disable works
- [ ] Error handling works (e.g., missing receiverId)

---

## 🎓 Common Event Names Reference

| Event Name | Direction | Purpose |
|------------|-----------|---------|
| `private:connected` | ← Server to Client | Connection confirmation |
| `private:sendMessage` | → Client to Server | Send a message |
| `private:message` | ← Server to Client | Receive a message |
| `private:autoReadOn` | → Client to Server | Enable auto-read |
| `private:autoReadOff` | → Client to Server | Disable auto-read |

---

## 📦 Postman Collection JSON (Optional)

You can import this collection into Postman:

```json
{
  "info": {
    "name": "Private Chat WebSocket Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Auth",
      "item": [
        {
          "name": "Login User A",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"phone\": \"+79097844503\",\n  \"password\": \"password\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:3000/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["auth", "login"]
            }
          }
        },
        {
          "name": "Login User B",
          "request": {
            "method": "POST",
            "header": [],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"phone\": \"+79097844504\",\n  \"password\": \"password\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            },
            "url": {
              "raw": "http://localhost:3000/auth/login",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["auth", "login"]
            }
          }
        }
      ]
    }
  ]
}
```

---

## 🚨 Important Notes

1. **Token in Query Parameter**: Unlike REST APIs, WebSocket connections in this system expect the JWT token as a query parameter, not in headers.

2. **Socket.IO Protocol**: Postman shows raw Socket.IO frames. The numbers at the start (42, 43, etc.) are part of the Socket.IO protocol.

3. **Real-Time Updates**: Keep both WebSocket tabs open to see real-time message delivery.

4. **Connection Timeout**: If inactive for too long, connection may timeout. Reconnect if needed.

5. **User IDs**: Make sure you use the correct user IDs for `receiverId`. Check your database or login response to get valid user IDs.

---

## 🎯 Success Criteria

Your test is successful if:

✅ Both users connect without errors  
✅ `private:connected` event received by both  
✅ First message from User A delivered to User B without calling `private:join`  
✅ Both users receive messages in real-time  
✅ Message structure is complete (id, conversationId, user object, etc.)  
✅ Bidirectional messaging works  
✅ Same conversationId used across messages  

---

**Happy Testing!** 🎉

If you encounter issues, check the server logs or refer to the troubleshooting section above.

