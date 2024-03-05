import { FileModule } from '../file/file.module';
import { LoggerModule } from '../logger/logger.module';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { ManagerStatistic } from './manager.statistic';
import { Module } from '@nestjs/common';
import { WsReceiveModule } from 'src/ws/receive/ws.receive.module';

@Module({
  imports: [WsReceiveModule, LoggerModule, FileModule],
  providers: [ManagerService, ManagerStatistic],
  controllers: [ManagerController],
  exports: [ManagerService]
})
export class ManagerModule {}
