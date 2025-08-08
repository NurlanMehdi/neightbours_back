/**
 * Утилиты для работы с географическими координатами
 */

/**
 * Рассчитывает расстояние между двумя точками по формуле гаверсинуса
 * @param lat1 Широта первой точки в градусах
 * @param lon1 Долгота первой точки в градусах
 * @param lat2 Широта второй точки в градусах
 * @param lon2 Долгота второй точки в градусах
 * @returns Расстояние в километрах
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Радиус Земли в километрах
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Преобразует градусы в радианы
 * @param degrees Градусы
 * @returns Радианы
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Проверяет, находится ли точка в заданном радиусе от центра
 * @param centerLat Широта центра
 * @param centerLon Долгота центра
 * @param pointLat Широта точки
 * @param pointLon Долгота точки
 * @param radiusKm Радиус в километрах
 * @returns true, если точка находится в радиусе
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number,
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
}
