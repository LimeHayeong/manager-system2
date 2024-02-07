import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io'

import { TaskStatesNoLogsDTO } from 'src/manager-sys/manager/dto/task-states.dto';
import { WebSocketResponse } from 'src/manager-sys/types/ws.response';
import { WsService } from './ws.service';
import { v4 as uuid } from 'uuid'
import { NewTaskLogRequestDTO, TaskLogRequestDTO } from './dto/task-log-request.dto';

// TODO: Error handling + websocket context error 전파 어떻게 할까.
@WebSocketGateway(3037, { namespace: 'ws' , cors: true})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect{
  @WebSocketServer()
  private server: Server;

  constructor(
    private readonly wsService: WsService,
  ) {}

  afterInit(server: Server) {
    console.log('[System] Websocket gateway initialized');
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
    // console.log(`[System] Client ${client.id} requested to reload task logs`);
    const payload = await this.wsService.getTaskLogs(data);
    const response: WebSocketResponse = {
      success: true,
      statusCode: 200,
      responseId: uuid(),
      payload: payload
    }
    this.server.emit('reloadTaskLogResponse', response);
  }

  @SubscribeMessage('newTaskLog')
  async handleNewTaskLog(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: NewTaskLogRequestDTO) {
    // console.log(`[System] Client ${client.id} requested to reload task logs`);
      const payload = await this.wsService.getNewTaskLogs(data);
      const response: WebSocketResponse = {
        success: true,
        statusCode: 200,
        responseId: uuid(),
        payload: payload
      }
      this.server.emit('newTaskLogResponse', response);
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
