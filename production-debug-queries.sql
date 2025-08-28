-- Production Debug Queries for Unread Messages Issue
-- Run these queries on your production database

-- 1. Check if User 18 exists
SELECT id, "firstName", "lastName", phone, "createdAt" 
FROM users 
WHERE id = 18;

-- 2. Check if Event 90 exists and is active
SELECT id, title, type, "isActive", "communityId", "createdAt"
FROM events 
WHERE id = 90;

-- 3. Check if User 18 is a participant in Event 90
SELECT * 
FROM users_on_events 
WHERE "userId" = 18 AND "eventId" = 90;

-- 4. Check all messages in Event 90
SELECT em.id, em.text, em."userId", em."createdAt", 
       u."firstName", u."lastName"
FROM event_messages em
JOIN users u ON em."userId" = u.id
WHERE em."eventId" = 90
ORDER BY em."createdAt" DESC;

-- 5. Check if User 18 has read Event 90
SELECT * 
FROM event_reads 
WHERE "userId" = 18 AND "eventId" = 90;

-- 6. Check all events where User 18 is a participant
SELECT ue."eventId", e.title, e.type, e."isActive"
FROM users_on_events ue
JOIN events e ON ue."eventId" = e.id
WHERE ue."userId" = 18;

-- 7. Count unread messages for User 18 manually
WITH user_participations AS (
  SELECT "eventId" 
  FROM users_on_events 
  WHERE "userId" = 18
),
read_events AS (
  SELECT "eventId"
  FROM event_reads
  WHERE "userId" = 18
),
unread_messages AS (
  SELECT em."eventId", e.type, COUNT(*) as message_count
  FROM event_messages em
  JOIN events e ON em."eventId" = e.id
  WHERE em."eventId" IN (SELECT "eventId" FROM user_participations)
    AND em."eventId" NOT IN (SELECT "eventId" FROM read_events)
    AND em."userId" != 18  -- Exclude user's own messages
    AND e."isActive" = true  -- Only active events
  GROUP BY em."eventId", e.type
)
SELECT 
  "eventId",
  type,
  message_count,
  SUM(CASE WHEN type = 'EVENT' THEN message_count ELSE 0 END) OVER() as total_events,
  SUM(CASE WHEN type = 'NOTIFICATION' THEN message_count ELSE 0 END) OVER() as total_notifications
FROM unread_messages;
