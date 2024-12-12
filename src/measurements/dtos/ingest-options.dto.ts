import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class IngestOptionsDto {
  @ApiPropertyOptional({ description: 'CSV separator, default is ";"' })
  @IsOptional()
  @IsString()
  separator?: string;

  @ApiPropertyOptional({
    description: 'Chunk size for batch insert, default is 500',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  chunkSize?: number;
}
