import { Module, forwardRef } from '@nestjs/common';

import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { WsGateway } from './ws.gateway';
import { WsService } from './ws.service';

@Module({
  imports: [forwardRef(() => ManagerModule)],
  providers: [WsGateway, WsService],
  exports: [WsGateway]
})
export class WsModule {}
