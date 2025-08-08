import { TransformFnParams } from 'class-transformer';

/**
 * Трансформер для преобразования массива строк в массив объектов с полем text
 * Поддерживает как строки, так и объекты для обратной совместимости
 * Также обрабатывает multipart/form-data формат с ключами votingOptions[0], votingOptions[1]
 */
export function votingOptionsTransformer({ value }: TransformFnParams): { text: string }[] {
  console.log('votingOptionsTransformer input:', JSON.stringify(value, null, 2));
  console.log('votingOptionsTransformer type:', typeof value);
  console.log('votingOptionsTransformer isArray:', Array.isArray(value));
  
  // Если value - это объект с ключами вида votingOptions[0], votingOptions[1]
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const options: { text: string }[] = [];
    const keys = Object.keys(value).sort();
    console.log('votingOptionsTransformer keys:', keys);
    
    for (const key of keys) {
      const item = value[key];
      console.log(`votingOptionsTransformer processing key ${key}:`, item);
      if (typeof item === 'string' && item.trim().length > 0) {
        options.push({ text: item.trim() });
      } else if (typeof item === 'object' && item !== null && typeof item.text === 'string') {
        options.push({ text: item.text.trim() });
      }
    }
    
    console.log('votingOptionsTransformer result:', JSON.stringify(options, null, 2));
    return options;
  }
  
  // Если value - это обычный массив
  if (Array.isArray(value)) {
    const result = value.map((item) => {
      if (typeof item === 'string') {
        return { text: item.trim() };
      }
      if (typeof item === 'object' && item !== null && typeof item.text === 'string') {
        return { text: item.text.trim() };
      }
      return { text: String(item).trim() };
    });
    console.log('votingOptionsTransformer array result:', JSON.stringify(result, null, 2));
    return result;
  }
  
  console.log('votingOptionsTransformer returning empty array');
  return [];
} 