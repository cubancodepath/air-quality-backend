import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Measurement entity representing a single data point of air quality measurement.
 */
@Entity('measurements')
export class MeasurementEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column({ type: 'float', nullable: true })
  co_gt: number;

  @Column({ type: 'float', nullable: true })
  pt08s1_co: number;

  @Column({ type: 'float', nullable: true })
  nmhc_gt: number;

  @Column({ type: 'float', nullable: true })
  c6h6_gt: number;

  @Column({ type: 'float', nullable: true })
  pt08s2_nmhc: number;

  @Column({ type: 'float', nullable: true })
  nox_gt: number;

  @Column({ type: 'float', nullable: true })
  pt08s3_nox: number;

  @Column({ type: 'float', nullable: true })
  no2_gt: number;

  @Column({ type: 'float', nullable: true })
  pt08s4_no2: number;

  @Column({ type: 'float', nullable: true })
  pt08s5_o3: number;

  @Column({ type: 'float', nullable: true })
  t: number;

  @Column({ type: 'float', nullable: true })
  rh: number;

  @Column({ type: 'float', nullable: true })
  ah: number;

  @Column({ type: 'float', nullable: true })
  air_quality_index: number;
}
