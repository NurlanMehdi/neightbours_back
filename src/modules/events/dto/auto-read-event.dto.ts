import { IsInt, Min } from 'class-validator';

/**
 * DTO для включения/выключения авточтения события
 */
export class AutoReadEventDto {
  @IsInt()
  @Min(1)
  eventId: number;
}

