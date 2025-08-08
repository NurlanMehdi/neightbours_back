import { Transform } from 'class-transformer';

/**
 * Трансформер для преобразования строки в число (float)
 */
export const TransformToFloat = () =>
  Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  });

/**
 * Трансформер для преобразования строки в число (integer)
 */
export const TransformToInt = () =>
  Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsed = parseInt(value);
      return isNaN(parsed) ? value : parsed;
    }
    return value;
  });

/**
 * Трансформер для преобразования строки в boolean
 */
export const TransformToBoolean = () =>
  Transform(({ value }) => {
    if (typeof value === 'string') {
      return value === 'true';
    }
    return value;
  });

/**
 * Трансформер для преобразования строки votingOptions в массив объектов
 */
export const TransformVotingOptions = () =>
  Transform(({ value }) => {
    if (!value) return value;

    // Если пришла строка 'Да,Нет,Возможно'
    if (typeof value === 'string') {
      return value
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(text => ({ text }));
    }

    // Если пришел массив строк ['Да', 'Нет'] (multipart формирует несколько полей votingOptions)
    if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
      return value
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .map(text => ({ text }));
    }

    // Если уже пришёл массив объектов [{ text: 'Да' }]
    return value;
  }); 