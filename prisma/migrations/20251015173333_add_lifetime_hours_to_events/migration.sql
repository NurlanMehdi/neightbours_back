-- AddLifetimeHoursToEvents
-- Добавляет поле lifetimeHours к таблице events для управления временем жизни уведомлений

ALTER TABLE "events" ADD COLUMN "lifetimeHours" INTEGER DEFAULT 24;

-- Добавляем комментарий к полю для документации
COMMENT ON COLUMN "events"."lifetimeHours" IS 'Время жизни уведомления в часах (только для типа NOTIFICATION). По умолчанию 24 часа.';
