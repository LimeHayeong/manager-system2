import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';

import { CustomInterceptor } from '../global.interceptor';
import { UseInterceptors } from '@nestjs/common';
import { baseGateway } from '../types/baseGateway';
import { Socket } from 'socket.io'
import { recentLogsRequestDTO } from './dto/recent-logs.dto';
import { LogCache } from './log.cache';
import { WebSocketResponse, WebSocketError } from '../types/ws.response';
import { v4 as uuid } from 'uuid'
import { TaskId } from '../types/taskId';

@WebSocketGateway(3033, { namespace: 'log', cors: { origin: '*' }})
@UseInterceptors(CustomInterceptor)
export class LogGateway extends baseGateway {
  constructor(
    private readonly logCache: LogCache,
  ) {
    super();
  }

  @SubscribeMessage('requestRTLog')
  handleRequestRTLog(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: recentLogsRequestDTO 
  ) {
    const { domain, task, taskType, offset, limit } = data;
    const taskId = TaskId.convertToTaskId(domain, task, taskType);

    let response: WebSocketResponse | WebSocketError;
    try {
      const payload = this.logCache.getRecentLogs(taskId, offset, limit);
      response = {
        code: 200,
        responseId: uuid(),
        payload: {
          message: null,
          data: payload
        }
      }
    } catch (e) {
      response = {
        code: e.code || 500,
        responseId: uuid(),
        payload: {
          message: e.message,
          error: e
        }
      }
    }
    client.emit('requestRTLogResponse', response);
  }
}
