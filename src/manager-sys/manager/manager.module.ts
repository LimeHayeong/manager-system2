import { LoggerModule } from '../logger/logger.module';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { Module } from '@nestjs/common';
import { WsReceiveModule } from 'src/ws/receive/ws.receive.module';

@Module({
  imports: [LoggerModule, WsReceiveModule],
  providers: [ManagerService],
  controllers: [ManagerController],
  exports: [ManagerService]
})
export class ManagerModule {}
