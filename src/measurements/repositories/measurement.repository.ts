import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { MeasurementEntity } from '../entities/measurement.entity';

@Injectable()
export class MeasurementRepository {
  constructor(
    @InjectRepository(MeasurementEntity)
    private readonly repo: Repository<MeasurementEntity>,
  ) {}

  async saveAll(data: Partial<MeasurementEntity>[]) {
    await this.repo.insert(data);
  }

  async findByParameterAndDateRange(
    parameter: string,
    start?: Date,
    end?: Date,
  ): Promise<{ timestamp: Date; value: number }[]> {
    const where: any = {};
    if (start && end) {
      where.timestamp = Between(start, end);
    } else if (start) {
      where.timestamp = Between(start, new Date());
    }

    // Para seguridad, mapeamos parameter a una columna válida
    const validParams = [
      'co_gt',
      'c6h6_gt',
      'nmhc_gt',
      'nox_gt',
      'no2_gt',
      'pt08s1_co',
      'pt08s2_nmhc',
      'pt08s3_nox',
      'pt08s4_no2',
      'pt08s5_o3',
      't',
      'rh',
      'ah',
    ];

    if (!validParams.includes(parameter)) {
      throw new Error(`Parametro "${parameter}" no válido`);
    }

    const data = await this.repo.find({
      where,
      order: { timestamp: 'ASC' },
      select: ['timestamp', parameter as keyof MeasurementEntity],
    });

    return data.map((d) => ({
      timestamp: d.timestamp,
      value: d[parameter as keyof MeasurementEntity] as number,
    }));
  }
}
