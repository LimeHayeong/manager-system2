import { ClsModule } from 'nestjs-cls';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { ServiceCController } from './service-c.controller';
import { ServiceCService } from './service-c.service';

@Module({
  imports: [ClsModule, ManagerModule],
  controllers: [ServiceCController],
  providers: [ServiceCService]
})
export class ServiceCModule {}