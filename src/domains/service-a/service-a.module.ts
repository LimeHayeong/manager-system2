import { ClsModule } from 'nestjs-cls';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { ServiceAController } from './service-a.controller';
import { ServiceAService } from './service-a.service';

@Module({
  imports: [ClsModule, ManagerModule],
  providers: [ServiceAService],
  controllers: [ServiceAController]
})
export class ServiceAModule {}
