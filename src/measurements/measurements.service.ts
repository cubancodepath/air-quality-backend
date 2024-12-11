import { Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import { Subject } from 'rxjs';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { MeasurementRepository } from './repositories/measurement.repository';

interface IngestionProgress {
  subject: Subject<number>;
  total: number;
  processed: number;
}

@Injectable()
export class MeasurementsService {
  constructor(private readonly measurementRepo: MeasurementRepository) {}

  private ingestions = new Map<string, IngestionProgress>();

  private toFloat(value: string | undefined): number | null {
    if (!value) return null;
    const val = value.trim().replace(',', '.');
    const parsed = parseFloat(val);
    return isNaN(parsed) ? null : parsed;
  }

  startIngestion(fileBuffer: Buffer, separator = ';', chunkSize = 500): string {
    const ingestionId = uuidv4();
    const subject = new Subject<number>();
    this.ingestions.set(ingestionId, { subject, total: 0, processed: 0 });
    this.asyncIngest(fileBuffer, separator, chunkSize, ingestionId);
    return ingestionId;
  }

  private asyncIngest(
    fileBuffer: Buffer,
    separator: string,
    chunkSize: number,
    ingestionId: string,
  ) {
    const tempRows: any[] = [];
    const ingestion = this.ingestions.get(ingestionId);
    if (!ingestion) return;

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);

    readable
      .pipe(csv({ separator }))
      .on('data', (data) => {
        tempRows.push(data);
      })
      .on('end', async () => {
        ingestion.total = tempRows.length;
        const results: any[] = [];
        let rowIndex = 0;

        const secondReadable = new Readable();
        secondReadable.push(fileBuffer);
        secondReadable.push(null);

        secondReadable
          .pipe(csv({ separator }))
          .on('data', (data) => {
            rowIndex++;
            const { subject, total } = this.ingestions.get(ingestionId)!;
            const dateString = (data['Date'] || '').trim();
            const timeStringOriginal = (data['Time'] || '').trim();

            if (!dateString || !timeStringOriginal) return;
            const dateParts = dateString.split('/');
            if (dateParts.length !== 3) return;
            const [day, month, year] = dateParts;
            const timeStr = timeStringOriginal.replace(/\./g, ':');
            const timestamp = new Date(`${year}-${month}-${day}T${timeStr}`);
            if (isNaN(timestamp.getTime())) return;

            results.push({
              timestamp,
              co_gt: this.toFloat(data['CO(GT)']),
              pt08s1_co: this.toFloat(data['PT08.S1(CO)']),
              nmhc_gt: this.toFloat(data['NMHC(GT)']),
              c6h6_gt: this.toFloat(data['C6H6(GT)']),
              pt08s2_nmhc: this.toFloat(data['PT08.S2(NMHC)']),
              nox_gt: this.toFloat(data['NOx(GT)']),
              pt08s3_nox: this.toFloat(data['PT08.S3(NOx)']),
              no2_gt: this.toFloat(data['NO2(GT)']),
              pt08s4_no2: this.toFloat(data['PT08.S4(NO2)']),
              pt08s5_o3: this.toFloat(data['PT08.S5(O3)']),
              t: this.toFloat(data['T']),
              rh: this.toFloat(data['RH']),
              ah: this.toFloat(data['AH']),
            });

            const progress = Math.floor((rowIndex / total) * 100);
            subject.next(progress);
          })
          .on('end', async () => {
            for (let i = 0; i < results.length; i += chunkSize) {
              const chunk = results.slice(i, i + chunkSize);
              await this.measurementRepo.saveAll(chunk);
            }
            ingestion.subject.next(100);
            ingestion.subject.complete();
          })
          .on('error', (err) => {
            ingestion.subject.error(err);
          });
      });
  }

  getIngestionProgress(id: string) {
    return this.ingestions.get(id)?.subject;
  }

  async getDataForParameter(
    parameter: string,
    start?: Date,
    end?: Date,
    page?: number,
    limit?: number,
  ) {
    return this.measurementRepo.findByParameterAndRange(
      parameter,
      start,
      end,
      page,
      limit,
    );
  }

  async getDataForDateRange(
    start: Date,
    end: Date,
    page?: number,
    limit?: number,
  ) {
    return this.measurementRepo.findAllByRange(start, end, page, limit);
  }
}
