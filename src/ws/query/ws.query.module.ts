import { ManagerModule } from 'src/manager-sys/manager/manager.module';
import { Module } from '@nestjs/common';
import { WsQueryGateway } from './ws.query.gateway';
import { WsQueryService } from './ws.query.service';

@Module({
  imports: [ManagerModule],
  providers: [WsQueryGateway, WsQueryService]
})
export class WsQueryModule {}
