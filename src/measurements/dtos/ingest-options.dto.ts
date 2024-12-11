import { IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestOptionsDto {
  @IsOptional()
  @IsString()
  separator?: string;

  @IsOptional()
  @IsNumber()
  chunkSize?: number;
}
