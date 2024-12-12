import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD or ISO8601)' })
  @IsDateString()
  start: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD or ISO8601)' })
  @IsDateString()
  end: string;

  @ApiProperty({ description: 'Parameter name, optional', required: false })
  @IsOptional()
  @IsString()
  parameter?: string;
}
