import { AppService } from './app.service';
import { DatabaseModule } from './manager-sys/database/database.module';
import { LogGateway } from './manager-sys/log/log.gateway';
import { LogModule } from './manager-sys/log/log.module';
import { ManagerModule } from './manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServiceAModule } from './domains/service-a/service-a.module';
import { StatisticModule } from './manager-sys/statistic/statistic.module';

@Module({
  imports: [
    /* Global Modules */
    /* System Modules */
    ManagerModule,
    LogModule,
    StatisticModule,

    ScheduleModule.forRoot(),

    /* Domain Modules */
    
    ServiceAModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
