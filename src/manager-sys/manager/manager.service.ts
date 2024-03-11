import { Injectable } from "@nestjs/common";
import { Log } from "../types/log";
import { LogService } from "../log/log.service";
import { ManagerGateway } from "./manager.gateway";
import { ManagerQueue } from "./manager.queue";
import { Task } from "../types/task";
import { TaskId } from "../types/taskId";
import { v4 as uuid } from 'uuid';

@Injectable()
export class ManagerService {
    private taskStates: Task.TaskState[];
    // private workStates = [];

    constructor(
        private readonly queue: ManagerQueue,
        private readonly wsGateway: ManagerGateway,
        private readonly logService: LogService
    ) {
        this.init();
    }

    private init() {
        this.taskStates = [];
        
        // 초기값 넣기
        TaskId.generateTaskId().map((id) => {
            this.taskStates.push({
                taskId: id,
                contextId: null,
                status: Task.Status.TERMINATED,
                updatedAt: Date.now(),
                startAt: 0,
                endAt: 0
            });
        })

        console.log('[System] ManagerService initialized');
    }

    public isRunning(taskId: string) {
        return this.taskStates.find((state) => state.taskId === taskId).status === Task.Status.RUNNING;
    }

    public isValidTask(taskId: string) {
        return this.taskStates.find((state) => state.taskId === taskId) !== undefined;
    }

    // TODO: CRON context에서 에러 전파하려면 여기서 정보를 제공해야함.
    public async buildTask(taskId: string): Promise<boolean> {
        const currentTask = this.getTaskState(taskId);
        if(!currentTask) return false;
        if(currentTask.status === Task.Status.RUNNING) return false;
        return true;
    }

    public async startTask(taskId: string, workId?: string) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();

        currentTask.status = Task.Status.RUNNING;
        currentTask.updatedAt = dateNow;
        currentTask.startAt = dateNow;
        currentTask.endAt = null;
        const contextId = this.genContextHeader(workId)
        currentTask.contextId = contextId
        
        const log = this.createLog(taskId, contextId, Log.Level.INFO, { message: 'Task started' }, dateNow);

        // Log transport
        this.transport(log);

        // WS Task 상태 업데이트
    }

    public async logTask(taskId: string, level: Log.Level, data: Log.IContext, workId?: string) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();
        currentTask.updatedAt = dateNow;

        // 로그 생성
        const log = this.createLog(taskId, currentTask.contextId, level, data, dateNow);

        this.transport(log);
    }

    public async endTask(taskId: string, workId?: string) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();

        if(Number(taskId.slice(-2)) === TaskId.TaskTypeEnum['CRON']){
            // CRON은 waiting.
            currentTask.status = Task.Status.IDLE;
        }else{
            // TRIGGER, WORK는 terminated.
            currentTask.status = Task.Status.TERMINATED;
        }
        currentTask.updatedAt = dateNow;
        currentTask.endAt = dateNow;

        const log = this.createLog(taskId, currentTask.contextId, Log.Level.INFO, { message: 'Task ended' }, dateNow);

        this.transport(log);

        // WS Task 상태 업데이트
    }

    private getTaskState(taskId: string) {
        const taskIdx = this.taskStates.findIndex((state) => state.taskId === taskId);
        if(taskIdx === -1) return null;
        return this.taskStates[taskIdx];
    }

    private genContextHeader(workId: string): string {
        return workId ? 'wt-' + uuid() : 'w0-' + uuid()
    }

    private createLog(taksId: string, contextId: string, level: Log.Level, data: Log.IContext, timestamp: number): Log.Log {
        return {
            taskId: taksId,
            contextId: contextId,
            level: level,
            data: data,
            timestamp: timestamp
        }
    }

    private transport(log: Log.Log) {
        // batchQueue에 넣기
        if(log.level !== Log.Level.INFO || log.data.message === 'start' || log.data.message === 'end'){
            this.queue.pushConsole(log);
        }
        this.queue.pushLog(log);

        // Log service 실시간 로그 저장
    }
}