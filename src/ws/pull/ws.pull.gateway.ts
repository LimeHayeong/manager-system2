import { CustomInterceptor } from "src/manager-sys/global.interceptor";
import { UseInterceptors } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { baseGateway } from "src/manager-sys/types/baseGateway";
import { Socket } from "socket.io";
import { recentLogsRequestDTO } from "../dto/recent-logs.dto";
import { TaskId } from "src/manager-sys/types/taskId";
import { WebSocketError, WebSocketResponse, wsError } from "src/manager-sys/types/ws.response";
import { v4 as uuid } from 'uuid'
import { LogCache } from "src/manager-sys/log/log.cache";
import { ManagerService } from "src/manager-sys/manager/manager.service";

@WebSocketGateway(3033, { namespace: 'ws', cors: { origin: '*' }})
@UseInterceptors(CustomInterceptor)
export class WsPullGateway extends baseGateway {
    constructor(
        private readonly logCache: LogCache,
        private readonly manager: ManagerService,
    ){
        super();
    }

    async handleConnection(client: Socket, ...args: any[]) {
        console.log(`[System] Client connected: ${client.id}`);
        try {
          // Intialize
          const initialStates = this.manager.getInitialStates()
          const response =  {
            code: 200,
            responseId: uuid(),
            payload: {
                message: null,
                data: initialStates
            }
          }
          client.emit('connectResponse', response);
        } catch(e) {
          console.log('try catch here');
          console.error(e);
          client.disconnect();
        }
      }

    @SubscribeMessage('requestRTLog')
    handleRequestRTLog(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: recentLogsRequestDTO 
    ) {
      const { domain, service, task, exeType, offset, limit } = data;
      const taskId = TaskId.convertToTaskId(domain, service, task);
  
      let response: WebSocketResponse | WebSocketError;
      try {
        const logs = this.logCache.getRecentLogs(taskId, exeType, offset, limit);
        response = {
          code: 200,
          responseId: uuid(),
          payload: {
            message: null,
            data: logs
          }
        }
      } catch (e) {
        response = {
          code: e instanceof wsError ? e.code : 500,
          responseId: uuid(),
          payload: {
            message: e instanceof wsError ? e.message : null,
            error: e instanceof wsError ? e.stack : null
          }
        }
      }
      client.emit('requestRTLogResponse', response);
    }
}