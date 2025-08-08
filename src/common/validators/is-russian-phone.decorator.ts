/**
 * Проверяет, что строка состоит из 11 цифр и начинается на 7 (например 79097844501).
 * Допускает любые символы-разделители — перед проверкой они убираются.
 */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsRussianPhoneConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const digitsOnly = value.replace(/[^0-9]/g, '');
    return /^7[0-9]{10}$/.test(digitsOnly);
  }
  defaultMessage(): string {
    return 'Телефон должен состоять из 11 цифр и начинаться с 7 (например 79097844501)';
  }
}

export function IsRussianPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsRussianPhoneConstraint,
    });
  };
}
