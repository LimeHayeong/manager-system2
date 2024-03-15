import { DeSerializedTaskState } from "./dto/task-states.dto";
import { Injectable } from "@nestjs/common";
import { Log } from "../types/log";
import { LogCache } from "../log/log.cache";
import { ManagerQueue } from "./manager.queue";
import { Task } from "../types/task";
import { TaskId } from "../types/taskId";
import { TaskStatesResponseDTO } from "src/ws/dto/task-states.dto";
import { WsPushGateway } from "src/ws/push/ws.push.gateway";
import { v4 as uuid } from 'uuid';

@Injectable()
export class ManagerService {
    private taskStates: Task.TaskState[];
    // private workStates = [];

    constructor(
        private readonly queue: ManagerQueue,
        private readonly wsGateway: WsPushGateway,
        private readonly logCache: LogCache,
    ) {
        this.init();
    }

    private init() {
        this.taskStates = [];
        
        // 초기값 넣기
        this.generateStates();

        console.log('[System] ManagerService initialized');
    }

    public isRunning(taskId: string) {
        return this.taskStates.find((state) => state.taskId === taskId).status === Task.Status.PROGRESS;
    }

    public isValidTask(taskId: string) {
        return this.taskStates.find((state) => state.taskId === taskId) !== undefined;
    }

    // TODO: CRON context에서 에러 전파하려면 여기서 정보를 제공해야함.
    public async buildTask(context: TaskId.context): Promise<boolean> {
        const { taskId, exeType } = context;
        const currentTask = this.getTaskState(taskId);
        if(!currentTask) {
            throw new Error('Invalid task');
        }
        if(currentTask.status === Task.Status.PROGRESS) {
            throw new Error('Task is already running');
        }
        return true;
    }

    public async startTask(context: TaskId.context, workId?: string) {
        const { taskId, exeType } = context; 
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();

        currentTask.status = Task.Status.PROGRESS;
        currentTask.updatedAt = dateNow;
        currentTask.startAt = dateNow;
        currentTask.endAt = null;
        const contextId = this.genContextHeader(workId)
        currentTask.contextId = contextId
        
        const log = this.createLog(taskId, contextId, Log.Level.INFO, Task.ExecutionType[exeType], { message: 'Task started' }, dateNow);

        // Log transportLog
        this.transportLog(log);

        // WS Task 상태 업데이트
        this.wsGateway.emitTaskStateUpdate(this.getDeserializedStates())
    }

    public async logTask(taskId: string, level: Log.Level, exeType: Task.ExecutionType, data: Log.IContext, workId?: string) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();
        currentTask.updatedAt = dateNow;

        // 로그 생성
        const log = this.createLog(taskId, currentTask.contextId, level, Task.ExecutionType[exeType], data, dateNow);

        this.transportLog(log);
    }

    public async endTask(context: TaskId.context, workId?: string) {
        const { taskId, exeType } = context;
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();

        if(exeType === Task.ExecutionType['CRON']){
            // CRON은 waiting.
            currentTask.status = Task.Status.WAITING;
        }else{
            // TRIGGER, WORK는 terminated.
            currentTask.status = Task.Status.TERMINATED;
        }
        currentTask.updatedAt = dateNow;
        currentTask.endAt = dateNow;

        const log = this.createLog(taskId, currentTask.contextId, Log.Level.INFO, Task.ExecutionType[exeType], { message: 'Task ended' }, dateNow);

        this.transportLog(log);

        // WS Task 상태 업데이트
        this.wsGateway.emitTaskStateUpdate(this.getDeserializedStates())
    }

    public getInitialStates(): TaskStatesResponseDTO{
        return this.getDeserializedStates();
    }

    private getDeserializedStates(): TaskStatesResponseDTO {
        const taskStates: DeSerializedTaskState[] = this.taskStates.map((state) => {
            const { domain, service, task } = TaskId.convertFromTaskId(state.taskId);
            return {
                domain: domain,
                service: service,
                task: task,
                exeType: state.exeType,
                contextId: state.contextId,
                status: state.status,
                updatedAt: state.updatedAt,
                startAt: state.startAt,
                endAt: state.endAt
            }
        })
        return {
            taskStates: taskStates,
            workStates: null,
        }
    }

    private getTaskState(taskId: string) {
        const taskIdx = this.taskStates.findIndex((state) => state.taskId === taskId);
        if(taskIdx === -1) return null;
        return this.taskStates[taskIdx];
    }

    private genContextHeader(workId: string): string {
        return workId ? 'wt-' + uuid() : '0t-' + uuid()
    }

    private createLog(taksId: string, contextId: string, level: Log.Level, exeType: Task.ExecutionType, data: Log.IContext, timestamp: number): Log.Log {
        return {
            taskId: taksId,
            contextId: contextId,
            level: level,
            exeType: exeType,
            data: data,
            timestamp: timestamp
        }
    }

    private transportLog(log: Log.Log) {
        // batchQueue에 넣기
        if(log.level !== Log.Level.INFO || log.data.message === 'start' || log.data.message === 'end'){
            this.queue.pushConsole(log);
        }
        this.queue.pushLog(log);

        // Log cache에 실시간 로그 저장
        this.logCache.pushLog(log.taskId, log);
    }

    private generateStates() {
        TaskId.generateTaskId().map((id) => {
            this.taskStates.push({
                taskId: id,
                exeType: Task.ExecutionType['CRON'],
                contextId: null,
                status: Task.Status.TERMINATED,
                updatedAt: null,
                startAt: null,
                endAt: null
            });
            this.taskStates.push({
                taskId: id,
                exeType: Task.ExecutionType['TRIGGER'],
                contextId: null,
                status: Task.Status.TERMINATED,
                updatedAt: null,
                startAt: null,
                endAt: null
            });
            this.taskStates.push({
                taskId: id,
                exeType: Task.ExecutionType['WORK'],
                contextId: null,
                status: Task.Status.TERMINATED,
                updatedAt: null,
                startAt: null,
                endAt: null
            });
        })
    }
}