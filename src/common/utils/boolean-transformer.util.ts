/**
 * Трансформирует строковое значение в булево
 * @param value - значение для трансформации
 * @returns булево значение
 */
export function transformBoolean(value: any): boolean {
  if (value === '') return false;
  if (typeof value === 'string') {
    const trimmed = value.trim().toLowerCase();
    return trimmed === 'true' || trimmed === '1' || trimmed === 'on';
  }
  return Boolean(value);
}
