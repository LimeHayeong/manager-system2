import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { WsGateway } from 'src/ws/ws.gateway';
import { Task } from '../types/task';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class ManagerService {
    constructor(
        @Inject(forwardRef(() => WsGateway))
        private readonly wsGateway: WsGateway,
        private readonly logger: LoggerService
    ) {}

    public async build(data: Task.ITaskIdentity) {
        console.log(`[${data.domain}:${data.task}:${data.taskType}] build`)
    }

    public async start(data: Task.ITaskIdentity) {
        console.log(`[${data.domain}:${data.task}:${data.taskType}] start`)
    }

    public async log(data: Task.ITaskIdentity, message: string) {
        console.log(`[${data.domain}:${data.task}:${data.taskType}] [log] ${message}`);
    }

    public async error(data: Task.ITaskIdentity, message: string) {
        console.log(`[${data.domain}:${data.task}:${data.taskType}] [error] ${message}`);
    }

    public async end(data: Task.ITaskIdentity) {
        console.log(`[${data.domain}:${data.task}:${data.taskType}] end`)
    };
    
    private logFormat() {}
}
