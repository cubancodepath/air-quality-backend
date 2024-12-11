import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ParameterSeriesDto {
  @IsString()
  parameter: string;

  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;
}
