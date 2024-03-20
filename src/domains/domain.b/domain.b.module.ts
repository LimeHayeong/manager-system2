import { ClsModule } from 'nestjs-cls';
import { DomainBController } from './domain.b.controller';
import { DomainBFirstService } from './domain.b.first.service';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ClsModule, ManagerModule],
  controllers: [DomainBController],
  providers: [DomainBFirstService],
  exports: [DomainBFirstService]
})
export class DomainBModule {}