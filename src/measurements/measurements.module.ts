import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeasurementEntity } from './entities/measurement.entity';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsService } from './measurements.service';
import { MeasurementRepository } from './repositories/measurement.repository';

@Module({
  imports: [TypeOrmModule.forFeature([MeasurementEntity])],
  controllers: [MeasurementsController],
  providers: [MeasurementsService, MeasurementRepository],
})
export class MeasurementsModule {}
