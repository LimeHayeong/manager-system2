import { Module, forwardRef } from '@nestjs/common';

import { LoggerModule } from '../logger/logger.module';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { WsModule } from 'src/ws/ws.module';

@Module({
  imports: [forwardRef(() => WsModule), LoggerModule],
  providers: [ManagerService],
  controllers: [ManagerController],
  exports: [ManagerService]
})
export class ManagerModule {}
