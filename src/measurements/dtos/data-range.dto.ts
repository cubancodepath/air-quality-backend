import { IsDateString, IsOptional, IsString } from 'class-validator';

export class DateRangeDto {
  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

  @IsOptional()
  @IsString()
  parameter?: string;
}
