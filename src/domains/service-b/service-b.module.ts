import { ClsModule } from 'nestjs-cls';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { ServiceBController } from './service-b.controller';
import { ServiceBService } from './service-b.service';

@Module({
  imports: [ClsModule, ManagerModule],
  controllers: [ServiceBController],
  providers: [ServiceBService],
  exports: [ServiceBService]
})
export class ServiceBModule {}
