import { ClsModule } from 'nestjs-cls';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { ServiceDController } from './service-d.controller';
import { ServiceDService } from './service-d.service';

@Module({
  imports: [ClsModule, ManagerModule],
  providers: [ServiceDService],
  controllers: [ServiceDController],
  exports: [ServiceDService]
})
export class ServiceDModule {}