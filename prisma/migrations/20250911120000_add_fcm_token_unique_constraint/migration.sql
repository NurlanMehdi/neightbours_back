-- CreateIndex
-- Добавляем уникальный индекс для FCM токенов (только для не-NULL значений)
CREATE UNIQUE INDEX CONCURRENTLY "users_fcmToken_unique" ON "public"."users" ("fcmToken") WHERE "fcmToken" IS NOT NULL AND "fcmToken" != '';

-- Очищаем дублирующиеся FCM токены перед добавлением ограничения
-- Оставляем только самую свежую запись для каждого токена
WITH duplicates AS (
  SELECT 
    "fcmToken",
    MIN(id) as keep_id
  FROM "public"."users"
  WHERE "fcmToken" IS NOT NULL 
    AND "fcmToken" != ''
  GROUP BY "fcmToken"
  HAVING COUNT(*) > 1
),
to_clear AS (
  SELECT u.id
  FROM "public"."users" u
  JOIN duplicates d ON u."fcmToken" = d."fcmToken"
  WHERE u.id != d.keep_id
)
UPDATE "public"."users" 
SET "fcmToken" = NULL 
WHERE id IN (SELECT id FROM to_clear);
