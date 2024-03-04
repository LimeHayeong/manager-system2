import { FileManager } from './file.manager';
import { ManagerController } from './manager.controller';
import { ManagerLogger } from './manager.logger';
import { ManagerService } from './manager.service';
import { ManagerStatistic } from './manager.statistic';
import { Module } from '@nestjs/common';
import { WsReceiveModule } from 'src/ws/receive/ws.receive.module';

@Module({
  imports: [WsReceiveModule],
  providers: [ManagerService, ManagerStatistic, ManagerLogger, FileManager],
  controllers: [ManagerController],
  exports: [ManagerService]
})
export class ManagerModule {}
