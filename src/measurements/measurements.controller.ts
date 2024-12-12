import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { map, Observable } from 'rxjs';
import { DateRangeDto } from './dtos/data-range.dto';
import { IngestOptionsDto } from './dtos/ingest-options.dto';
import { PaginationDto } from './dtos/pagination.dto';
import { ParameterSeriesDto } from './dtos/parameter-series.dto';
import { MeasurementsService } from './measurements.service';

@ApiTags('Measurements')
@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly service: MeasurementsService) {}

  /**
   * Upload CSV file for ingestion.
   */
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOkResponse({ description: 'Returns an ingestionId to track progress' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() options: IngestOptionsDto,
  ) {
    const separator = options.separator || ';';
    const chunkSize = options.chunkSize || 500;
    const ingestionId = this.service.startIngestion(
      file.buffer,
      separator,
      chunkSize,
    );
    return { ingestionId };
  }

  /**
   * Get ingestion progress via SSE.
   */
  @Get('progress/:id')
  @ApiOkResponse({
    description: 'Server-Sent Events stream of progress (0-100%)',
  })
  @Sse()
  progress(@Param('id') id: string): Observable<MessageEvent> {
    const subject = this.service.getIngestionProgress(id);
    if (!subject) {
      return new Observable((observer) => {
        observer.error(new Error(`Ingestion with id ${id} not found`));
      });
    }

    return subject.pipe(
      map((progress) => ({ data: progress }) as MessageEvent),
    );
  }

  /**
   * Fetch time series data for a specific parameter.
   * Optional date range (start, end), pagination.
   */
  @Get('parameter-time-series')
  @ApiOkResponse({
    description: 'Returns time series data for the specified parameter',
  })
  async getParameterSeries(
    @Query() query: ParameterSeriesDto,
    @Query() pagination: PaginationDto,
  ) {
    const { parameter, start, end } = query;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const page = pagination.page ? parseInt(pagination.page, 10) : undefined;
    const limit = pagination.limit ? parseInt(pagination.limit, 10) : undefined;

    return this.service.getDataForParameter(
      parameter,
      startDate,
      endDate,
      page,
      limit,
    );
  }

  /**
   * Fetch data within a specific date range.
   */
  @Get('date-range')
  @ApiOkResponse({
    description: 'Returns data for a specific date range',
  })
  async getDateRange(
    @Query() query: DateRangeDto,
    @Query() pagination: PaginationDto,
  ) {
    const { start, end } = query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const page = pagination.page ? parseInt(pagination.page, 10) : undefined;
    const limit = pagination.limit ? parseInt(pagination.limit, 10) : undefined;

    return this.service.getDataForDateRange(startDate, endDate, page, limit);
  }
}
