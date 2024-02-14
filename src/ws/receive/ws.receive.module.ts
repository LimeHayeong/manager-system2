import { Module } from '@nestjs/common';
import { WsReceiveGateway } from './ws.receive.gateway';

@Module({
  imports: [],
  providers: [WsReceiveGateway],
  exports: [WsReceiveGateway],
})
export class WsReceiveModule {}
