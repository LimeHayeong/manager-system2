import { ClsModule } from 'nestjs-cls';
import { DomainCController } from './domain.c.controller';
import { DomainCFirstService } from './domain.c.first.service';
import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [ClsModule, ManagerModule],
  controllers: [DomainCController],
  providers: [DomainCFirstService]
})
export class DomainCModule {}