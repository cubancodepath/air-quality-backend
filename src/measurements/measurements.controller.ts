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
import { map, Observable } from 'rxjs';
import { IngestOptionsDto } from './dtos/ingest-options.dto';
import { QueryTimeSeriesDto } from './dtos/query-time-series.dto';
import { MeasurementsService } from './measurements.service';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly service: MeasurementsService) {}

  @Post('upload')
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

  @Get('progress/:id')
  @Sse()
  progress(@Param('id') id: string): Observable<MessageEvent> {
    const subject = this.service.getIngestionProgress(id);
    if (!subject) {
      return new Observable((observer) => {
        observer.error(`There is no ingestion with id: ${id}`);
      });
    }

    return subject.pipe(
      map((progress) => {
        return { data: progress } as MessageEvent;
      }),
    );
  }

  @Get('time-series')
  async getTimeSeries(@Query() query: QueryTimeSeriesDto) {
    const { parameter, start, end } = query;
    const startDate = start ? new Date(start) : undefined;
    const endDate = end ? new Date(end) : undefined;
    const data = await this.service.getTimeSeries(
      parameter,
      startDate,
      endDate,
    );
    return data;
  }
}
