-- Удаление колонки isRead из таблицы event_messages
ALTER TABLE "public"."event_messages" DROP COLUMN IF EXISTS "isRead";


