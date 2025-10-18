-- AddEventStatus
-- Добавляет enum EventStatus и поле status к таблице events для управления статусом событий

-- Создаем enum EventStatus
CREATE TYPE "public"."EventStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- Добавляем поле status к таблице events
ALTER TABLE "events" ADD COLUMN "status" "public"."EventStatus" NOT NULL DEFAULT 'ACTIVE';

-- Добавляем комментарий к полю для документации
COMMENT ON COLUMN "events"."status" IS 'Статус события: ACTIVE - активное событие, COMPLETED - завершенное событие';
