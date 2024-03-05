import { AppService } from './app.service';
import { FileModule } from './manager-sys/file/file.module';
import { ManagerModule } from './manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { SampleWorkModule } from './domains/sample-work/sample-work.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServiceAModule } from './domains/service-a/service-a.module';
import { ServiceBModule } from './domains/service-b/service-b.module';
import { ServiceCModule } from './domains/service-c/service-c.module';
import { ServiceDModule } from './domains/service-d/service-d.module';
import { WsQueryModule } from './ws/query/ws.query.module';

@Module({
  imports: [
    /* Global Modules */
    /* System Modules */
    ManagerModule,
    WsQueryModule,
    ScheduleModule.forRoot(),

    /* Domain Modules */
    
    ServiceAModule,
    ServiceBModule,
    ServiceCModule,
    ServiceDModule,

    SampleWorkModule,
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {}
