import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/models/paginated-query.dto';

export class GetFamilyTypesAdminDto extends PaginationQueryDto {
  @ApiProperty({ description: 'Поиск по названию', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}
