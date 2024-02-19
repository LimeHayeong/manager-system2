import { ClsModule } from 'nestjs-cls';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { SampleWorkController } from './sample-work.controller';
import { SampleWorkService } from './sample-work.service';
import { ServiceAModule } from '../service-a/service-a.module';
import { ServiceAService } from '../service-a/service-a.service';
import { ServiceBModule } from '../service-b/service-b.module';
import { ServiceCModule } from '../service-c/service-c.module';
import { ServiceDModule } from '../service-d/service-d.module';

@Module({
  imports: [ClsModule, ManagerModule, ServiceAModule, ServiceBModule, ServiceDModule],
  providers: [SampleWorkService],
  controllers: [SampleWorkController]
})
export class SampleWorkModule {}
