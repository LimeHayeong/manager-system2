import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { TaskStatesNoLogsDTO } from 'src/manager-sys/manager/dto/task-states.dto';
import { UseInterceptors } from '@nestjs/common';
import { WebSocketResponse } from 'src/manager-sys/types/ws.response';
import { v4 as uuid } from 'uuid'

@WebSocketGateway(3033, { namespace: 'ws', cors: { origin: '*' }})
@UseInterceptors(CustomInterceptor)
export class WsReceiveGateway implements OnGatewayConnection, OnGatewayDisconnect{
  @WebSocketServer()
  private server: Server;

  constructor(
  ) {}

  async handleConnection(client: Socket, ...args: any[]) {
    console.log(`[System] Client connected: ${client.id}`);
    try {
      // Intialize

    } catch(e) {
      // TODO: Connection error handling
      console.log('try catch here');
      console.error(e);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    console.log(`[System] Client disconnected: ${client.id}`);
    try {

    } catch(e) {
      // TODO: Disconnection error handling
      console.error(e);
      client.disconnect();
    }
  }

  afterInit(server: Server) {
    console.log('[System] Websocket receive-gateway initialized');
  }

  public async emitTaskStateUpdate(data: TaskStatesNoLogsDTO) {
    const response: WebSocketResponse = {
      success: true,
      statusCode: 200,
      responseId: uuid(),
      payload: data,
    }
    this.server.emit('taskStateUpdate', response);
  }
}
