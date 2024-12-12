import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ParameterSeriesDto {
  @ApiProperty({ description: 'Parameter name (e.g. co_gt, c6h6_gt, etc.)' })
  @IsString()
  parameter: string;

  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD or ISO8601)' })
  @IsOptional()
  @IsDateString()
  start?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD or ISO8601)' })
  @IsOptional()
  @IsDateString()
  end?: string;
}
