import { UseInterceptors } from '@nestjs/common';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { WsQueryService } from './ws.query.service';
import { v4 as uuid } from 'uuid';
import { WebSocketError, WebSocketResponse } from 'src/manager-sys/types/ws.response';
import { NewTaskLogRequestDTO, TaskLogRequestDTO } from '../dto/task-log-request.dto';

@WebSocketGateway(3033, { namespace: 'ws', cors: { origin: '*' }})
@UseInterceptors(CustomInterceptor)
export class WsQueryGateway implements OnGatewayConnection, OnGatewayDisconnect{
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly wsService: WsQueryService,
  ) {}

  afterInit(server: Server) {
    console.log('[System] Websocket query-gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    console.log(`[System] Client connected: ${client.id}`);
    try {
      // Intialize
      const initialStates = await this.wsService.getInitialStates()
      const response: WebSocketResponse = {
        success: true,
        statusCode: 200,
        responseId: uuid(),
        payload: initialStates,
      }
      this.server.emit('connectResponse', response);
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

  @SubscribeMessage('reloadTaskLog')
  async handleReloadTaskLog(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: TaskLogRequestDTO) {
    let response: WebSocketResponse | WebSocketError;
    try {
      const payload = await this.wsService.getTaskLogs(data);
      response = {
        success: true,
        statusCode: 200,
        responseId: uuid(),
        payload: payload
      }
    } catch (e) {
      response = {
        success: false,
        statusCode: 404,
        responseId: uuid(),
        error: e.message
      }
    }
    this.server.emit('reloadTaskLogResponse', response);
  }

  @SubscribeMessage('newTaskLog')
  async handleNewTaskLog(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: NewTaskLogRequestDTO) {
    let response: WebSocketResponse | WebSocketError;
    try {
      const payload = await this.wsService.getNewTaskLogs(data);
      response = {
        success: true,
        statusCode: 200,
        responseId: uuid(),
        payload: payload
      }
    } catch (e) {
      response = {
        success: false,
        statusCode: 404,
        responseId: uuid(),
        error: e.message
      }
    }
    this.server.emit('newTaskLogResponse', response);
  }
}
