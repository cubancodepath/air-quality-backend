import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeasurementEntity } from '../entities/measurement.entity';

@Injectable()
export class MeasurementRepository {
  constructor(
    @InjectRepository(MeasurementEntity)
    private readonly repo: Repository<MeasurementEntity>,
  ) {}

  private validParams = [
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
    'air_quality_index',
  ];

  async saveAll(data: Partial<MeasurementEntity>[]): Promise<void> {
    await this.repo.insert(data);
  }

  async findByParameterAndRange(
    parameter: string,
    start?: Date,
    end?: Date,
    page?: number,
    limit?: number,
  ): Promise<{ timestamp: Date; value: number }[]> {
    if (!this.validParams.includes(parameter)) {
      throw new BadRequestException(`Parameter "${parameter}" not valid`);
    }

    const qb = this.repo.createQueryBuilder('m');

    if (start && end) {
      qb.where('m.timestamp BETWEEN :start AND :end', { start, end });
    } else if (start) {
      qb.where('m.timestamp >= :start', { start });
    }

    qb.select(['m.timestamp', `m.${parameter}`]).orderBy('m.timestamp', 'ASC');

    if (page && limit) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const data = await qb.getRawMany();
    return data.map((d) => ({
      timestamp: d['m_timestamp'],
      value: d[`m_${parameter}`],
    }));
  }

  async findAllByRange(
    start: Date,
    end: Date,
    page?: number,
    limit?: number,
  ): Promise<any[]> {
    const qb = this.repo
      .createQueryBuilder('m')
      .where('m.timestamp BETWEEN :start AND :end', { start, end })
      .orderBy('m.timestamp', 'ASC')
      .select(['m.timestamp', ...this.validParams.map((p) => `m.${p}`)]);

    if (page && limit) {
      qb.skip((page - 1) * limit).take(limit);
    }

    const data = await qb.getRawMany();
    return data.map((d) => {
      const obj: any = { timestamp: d['m_timestamp'] };
      this.validParams.forEach((param) => {
        obj[param] = d[`m_${param}`];
      });
      return obj;
    });
  }
}
