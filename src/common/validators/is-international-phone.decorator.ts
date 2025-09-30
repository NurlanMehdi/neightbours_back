/**
 * Проверяет, что строка соответствует международному формату телефона E.164.
 * Формат: +CountryCodePhoneNumber (например +79097844501, +12345678901)
 */
import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsInternationalPhoneConstraint
  implements ValidatorConstraintInterface
{
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    return /^\+[1-9]\d{7,14}$/.test(value);
  }
  defaultMessage(): string {
    return 'Номер телефона должен быть в международном формате E.164 (например +79097844501, +12345678901)';
  }
}

export function IsInternationalPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsInternationalPhoneConstraint,
    });
  };
}
