import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({
    description: 'Number of items per page for pagination',
  })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}
