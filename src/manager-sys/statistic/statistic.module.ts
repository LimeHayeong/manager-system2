import { DatabaseModule } from '../database/database.module';
import { Module } from '@nestjs/common';
import { StatisticController } from './statistic.controller';
import { StatisticService } from './statistic.service';
import { statisticProviders } from './statistic.providers';

@Module({
  imports: [DatabaseModule],
  controllers: [StatisticController],
  providers: [StatisticService,
  ...statisticProviders]
})
export class StatisticModule {}
