import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import { LogService } from './log.service';

@WebSocketGateway()
export class LogGateway {
  constructor(
    private readonly logService: LogService,
  ) {

  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }
}
