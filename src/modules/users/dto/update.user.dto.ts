import { ApiProperty } from '@nestjs/swagger';
import { BaseUserDto } from '../../../common/dto/base.dto';
import { IsArray, IsNumber, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TransformToInt } from '../../../common/utils/form-data-transformers.util';

export class UpdateUserDto extends BaseUserDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Аватар пользователя',
    required: false,
  })
  avatar?: Express.Multer.File;

  @ApiProperty({
    description: 'ID квалификаций пользователя',
    type: [Number],
    required: false,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim() === '') {
        return [];
      }
      return value.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0);
    }
    return value;
  })
  qualificationIds?: number[];

  @ApiProperty({
    description: 'ID продуктов пользователя',
    type: [Number],
    required: false,
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      if (value.trim() === '') {
        return [];
      }
      return value.split(',').map(id => Number(id.trim())).filter(id => !isNaN(id) && id > 0);
    }
    return value;
  })
  productIds?: number[];

  @ApiProperty({
    description: 'ID типа семьи',
    type: Number,
    required: false,
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @TransformToInt()
  familyTypeId?: number;
}
