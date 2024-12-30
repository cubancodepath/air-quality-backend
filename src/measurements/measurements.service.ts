import { Injectable } from '@nestjs/common';
import * as csv from 'csv-parser';
import { ReplaySubject } from 'rxjs';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import { MeasurementRepository } from './repositories/measurement.repository';
import { calculateAqi } from './utils/aqi-calculator';

interface IngestionState {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  processed: number;
  total: number;
  timestamp: string;
  error?: string;
}

interface IngestionProgress {
  subject: ReplaySubject<IngestionState>;
  state: IngestionState;
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

  private updateIngestionState(
    ingestionId: string,
    partial: Partial<IngestionState>,
  ) {
    const ingestion = this.ingestions.get(ingestionId);
    if (!ingestion) return;

    ingestion.state = {
      ...ingestion.state,
      ...partial,
      timestamp: new Date().toISOString(),
    };
    ingestion.subject.next(ingestion.state);
  }

  startIngestion(fileBuffer: Buffer, separator = ';', chunkSize = 500): string {
    const ingestionId = uuidv4();
    const subject = new ReplaySubject<IngestionState>(50);

    const initialState: IngestionState = {
      status: 'idle',
      progress: 0,
      processed: 0,
      total: 0,
      timestamp: new Date().toISOString(),
    };

    this.ingestions.set(ingestionId, {
      subject,
      state: initialState,
    });

    // Emitir estado inicial
    subject.next(initialState);

    // Iniciar procesamiento asíncrono
    this.asyncIngest(fileBuffer, separator, chunkSize, ingestionId);

    return ingestionId;
  }

  private async asyncIngest(
    fileBuffer: Buffer,
    separator: string,
    chunkSize: number,
    ingestionId: string,
  ) {
    const tempRows: any[] = [];
    const ingestion = this.ingestions.get(ingestionId);
    if (!ingestion) return;

    try {
      // Update processed state
      this.updateIngestionState(ingestionId, {
        status: 'processing',
        progress: 0,
      });

      const readable = new Readable();
      readable.push(fileBuffer);
      readable.push(null);

      // Count rows
      await new Promise((resolve, reject) => {
        readable
          .pipe(csv({ separator }))
          .on('data', (data) => {
            tempRows.push(data);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      this.updateIngestionState(ingestionId, {
        total: tempRows.length,
      });

      // Segunda pasada: procesar registros
      const results: any[] = [];
      let rowIndex = 0;

      const secondReadable = new Readable();
      secondReadable.push(fileBuffer);
      secondReadable.push(null);

      await new Promise((resolve, reject) => {
        secondReadable
          .pipe(csv({ separator }))
          .on('data', (data) => {
            rowIndex++;
            const dateString = (data['Date'] || '').trim();
            const timeStringOriginal = (data['Time'] || '').trim();

            if (!dateString || !timeStringOriginal) return;
            const dateParts = dateString.split('/');
            if (dateParts.length !== 3) return;

            const [day, month, year] = dateParts;
            const timeStr = timeStringOriginal.replace(/\./g, ':');
            const timestamp = new Date(`${year}-${month}-${day}T${timeStr}`);
            if (isNaN(timestamp.getTime())) return;

            const co_gt = this.toFloat(data['CO(GT)']);
            const pt08s5_o3 = this.toFloat(data['PT08.S5(O3)']);
            const no2_gt = this.toFloat(data['NO2(GT)']);

            results.push({
              timestamp,
              co_gt: co_gt,
              pt08s1_co: this.toFloat(data['PT08.S1(CO)']),
              nmhc_gt: this.toFloat(data['NMHC(GT)']),
              c6h6_gt: this.toFloat(data['C6H6(GT)']),
              pt08s2_nmhc: this.toFloat(data['PT08.S2(NMHC)']),
              nox_gt: this.toFloat(data['NOx(GT)']),
              pt08s3_nox: this.toFloat(data['PT08.S3(NOx)']),
              no2_gt: no2_gt,
              pt08s4_no2: this.toFloat(data['PT08.S4(NO2)']),
              pt08s5_o3: pt08s5_o3,
              t: this.toFloat(data['T']),
              rh: this.toFloat(data['RH']),
              ah: this.toFloat(data['AH']),
              air_quality_index: calculateAqi(co_gt, no2_gt, pt08s5_o3),
            });

            const progress = Math.floor((rowIndex / tempRows.length) * 100);
            this.updateIngestionState(ingestionId, {
              progress,
              processed: rowIndex,
            });
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // save chunks
      for (let i = 0; i < results.length; i += chunkSize) {
        const chunk = results.slice(i, i + chunkSize);
        await this.measurementRepo.saveAll(chunk);
      }

      // mark as completed
      this.updateIngestionState(ingestionId, {
        status: 'completed',
        progress: 100,
        processed: tempRows.length,
      });

      ingestion.subject.complete();
    } catch (error) {
      // errors are handled here
      this.updateIngestionState(ingestionId, {
        status: 'error',
        error: error.message,
      });
      ingestion.subject.error(error);
    }
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
