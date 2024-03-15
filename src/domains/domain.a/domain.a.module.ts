import { ClsModule } from 'nestjs-cls';
import { DomainAController } from './domain.a.controller';
import { DomainAFirstService } from './domain.a.first.service';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
@Module({
  imports: [ClsModule, ManagerModule],
  controllers: [DomainAController],
  providers: [DomainAFirstService],
  exports: [DomainAFirstService]
})
export class DomainAModule {}
