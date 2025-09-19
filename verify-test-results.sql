-- Verification queries for markAsRead testing

-- 1. Show all messages in test conversation
SELECT 
  pm.id as message_id,
  pm."senderId" as sender,
  pm.text,
  pm."createdAt"
FROM private_messages pm 
WHERE pm."conversationId" = 100 
ORDER BY pm."createdAt";

-- 2. Show message_seen records (which messages have been marked as read by whom)
SELECT 
  ms."messageId" as message_id,
  ms."userId" as reader,
  ms."seenAt",
  pm."senderId" as original_sender,
  pm.text
FROM message_seen ms
JOIN private_messages pm ON ms."messageId" = pm.id
WHERE pm."conversationId" = 100
ORDER BY ms."messageId";

-- 3. Show conversation participants and their lastReadAt timestamps
SELECT 
  cp."conversationId",
  cp."userId",
  cp."lastReadAt",
  u."firstName" as user_name
FROM conversation_participants cp
JOIN users u ON cp."userId" = u.id
WHERE cp."conversationId" = 100;

-- 4. Count unread messages for each user
SELECT 
  'User 7 unread messages' as description,
  COUNT(*) as count
FROM private_messages pm
LEFT JOIN message_seen ms ON pm.id = ms."messageId" AND ms."userId" = 7
WHERE pm."conversationId" = 100 
  AND pm."senderId" != 7 
  AND ms."messageId" IS NULL

UNION ALL

SELECT 
  'User 8 unread messages' as description,
  COUNT(*) as count
FROM private_messages pm
LEFT JOIN message_seen ms ON pm.id = ms."messageId" AND ms."userId" = 8
WHERE pm."conversationId" = 100 
  AND pm."senderId" != 8 
  AND ms."messageId" IS NULL;

-- 5. Expected vs Actual results summary
SELECT 
  'Messages from User 7 to User 8' as category,
  COUNT(*) as total_messages,
  COUNT(ms."messageId") as marked_as_read_by_user8
FROM private_messages pm
LEFT JOIN message_seen ms ON pm.id = ms."messageId" AND ms."userId" = 8
WHERE pm."conversationId" = 100 AND pm."senderId" = 7

UNION ALL

SELECT 
  'Messages from User 8 to User 7' as category,
  COUNT(*) as total_messages,
  COUNT(ms."messageId") as marked_as_read_by_user7
FROM private_messages pm
LEFT JOIN message_seen ms ON pm.id = ms."messageId" AND ms."userId" = 7
WHERE pm."conversationId" = 100 AND pm."senderId" = 8;
