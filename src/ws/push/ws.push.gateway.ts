import { CustomInterceptor } from "src/manager-sys/global.interceptor";
import { Server } from "socket.io";
import { TaskStatesDTO } from "../dto/task-states.dto";
import { UseInterceptors } from "@nestjs/common";
import { WebSocketGateway } from "@nestjs/websockets";
import { WebSocketResponse } from "src/manager-sys/types/ws.response";
import { baseGateway } from "src/manager-sys/types/baseGateway";
import { v4 as uuid } from 'uuid'

@WebSocketGateway(3033, { namespace: 'ws', cors: { origin: '*' }})
@UseInterceptors(CustomInterceptor)
export class WsPushGateway extends baseGateway {
    constructor(){
        super();
    }

    afterInit(server: Server) {
        super.afterInit(server);
        console.log('[System] ManagerGateway initialized');
    }
    
    public async emitTaskStateUpdate(data: TaskStatesDTO) {
        // settled 될 때까지 대기.
        while (!this.gatewaySettled) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        const response: WebSocketResponse = {
            code: 200,
            responseId: uuid(),
            payload: {
            message: null,
            data: data
            }
        }
        this.server.emit('taskStateUpdate', response);
    }
}