import { ClsModule } from 'nestjs-cls';
import { DomainDController } from './domain.controller';
import { DomainDFirstService } from './domain.first.service';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ClsModule, ManagerModule],
  controllers: [DomainDController],
  providers: [DomainDFirstService],
  exports: [DomainDFirstService]
})
export class DomainDModule {}