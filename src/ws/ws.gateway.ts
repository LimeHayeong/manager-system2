import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

@WebSocketGateway(3037, { namespace: 'ws' , cors: true})
export class WsGateway {
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    return 'Hello world!';
  }

  taskStateUpdate() {}
}
