-- Запросы для расследования проблемы с гео-модерацией
-- Выполните эти запросы в продакшен базе данных

-- 1. Проверить текущие настройки гео-модерации
SELECT * FROM geo_moderation_settings ORDER BY "createdAt" DESC;

-- 2. Найти все отклонения для пользователя 15 (Сергей Зыков)
SELECT 
    gmr.*,
    u."firstName",
    u."lastName"
FROM geo_moderation_rejections gmr
JOIN users u ON gmr."userId" = u.id
WHERE gmr."userId" = 15
ORDER BY gmr."createdAt" DESC;

-- 3. Найти объект недвижимости 18
SELECT 
    p.*,
    u."firstName",
    u."lastName",
    u.latitude as user_lat,
    u.longitude as user_lon
FROM properties p
JOIN users u ON p."userId" = u.id
WHERE p.id = 18;

-- 4. Проверить все объекты пользователя 15
SELECT * FROM properties WHERE "userId" = 15 ORDER BY "createdAt";

-- 5. Найти пользователей с координатами далеко от их объектов
SELECT 
    p.id as property_id,
    p.name as property_name,
    p.latitude as prop_lat,
    p.longitude as prop_lon,
    u.id as user_id,
    u."firstName",
    u."lastName",
    u.latitude as user_lat,
    u.longitude as user_lon,
    -- Примерный расчет расстояния (не точный, для фильтрации)
    ABS(p.latitude - u.latitude) + ABS(p.longitude - u.longitude) as distance_approx
FROM properties p
JOIN users u ON p."userId" = u.id
WHERE ABS(p.latitude - u.latitude) + ABS(p.longitude - u.longitude) > 0.1  -- примерно 10км
ORDER BY distance_approx DESC;

-- 6. История изменений настроек (если есть аудит таблица)
-- SELECT * FROM audit_log WHERE table_name = 'geo_moderation_settings';
