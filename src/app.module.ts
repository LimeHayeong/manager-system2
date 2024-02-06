import { AppService } from './app.service';
import { LoggerModule } from './manager-sys/logger/logger.module';
import { ManagerModule } from './manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ServiceAModule } from './domains/service-a/service-a.module';
import { ServiceBModule } from './domains/service-b/service-b.module';
import { ServiceCModule } from './domains/service-c/service-c.module';
import { ServiceDModule } from './domains/service-d/service-d.module';
import { WsModule } from './ws/ws.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    /* System Modules */
    WsModule,
    ManagerModule,
    LoggerModule,
    /* Domain Modules */
    ServiceAModule,
    ServiceBModule,
    ServiceCModule,
    ServiceDModule
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
