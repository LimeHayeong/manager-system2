import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { WsGateway } from 'src/ws/ws.gateway';
import { Task } from '../types/task';
import { LoggerService } from '../logger/logger.service';
import { v4 as uuid } from 'uuid'
import { TaskStatesNoLogsDTO } from './dto/task-states.dto';
import { TaskStateWithNewLogsDTO, TaskStateWithSeqLogsDTO } from './dto/task-state.dto';

const newTasks: Task.TaskStatewithLogs[] = [
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        status: Task.TaskStatus.TERMINATED,
        contextId: null,
        isAvailable: true,
        updatedAt: null,
        startAt: null,
        endAt: null,
        recentLogs: [[]],
    },
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
        status: Task.TaskStatus.WAITING,
        contextId: null,
        isAvailable: true,
        updatedAt: null,
        startAt: null,
        endAt: null,
        recentLogs: [[]]
    },
];
const newWorks: Task.WorkState[] = []

// TODO: Configuration
const maxLogsNumber = 3;

// TODO: Manager service 완성
@Injectable()
export class ManagerService {
    private taskStates: Task.TaskStatewithLogs[] = [];
    private workStates: Task.WorkState[] = [];
    private maxRecentLogs;

    constructor(
        @Inject(forwardRef(() => WsGateway))
        private readonly wsGateway: WsGateway,
        private readonly logger: LoggerService
    ) {
        this.initialization();
    }

    private initialization() {
        // TODO: snapshot 만들어서 과거 state 복원 로직 추가

        this.maxRecentLogs = maxLogsNumber;
        newTasks.forEach(newTask => this.taskStates.push(newTask));
        newWorks.forEach(newWork => this.workStates.push(newWork));

        console.log('[System] ManagerService initialized');
    }

    // Task를 시작하기 전에 실행 가능한지 확인하는 함수.
    // TODO: build 실패시 각 상황에서 msg 전파
    public async buildTask(taskId: Task.ITaskIdentity): Promise<boolean> {
        // Task 유효성 검사, build level에 문제가 없으면 향후에는 검사 안 함. (고정된 값을 쓰기 때문)
        const currentTask = this.getTaskState(taskId);
        if(currentTask == null) { 
            // task가 없으면, false 반환
            // Q. 맞을까? 이러면 미리 다 선언하긴 해야함.
            console.log(`[System] task not found - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        if(currentTask.isAvailable === false){
            // task가 실행 불가능하면, false 반환.
            console.log(`[System] task is not available - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        // task가 실행 중이면, false 반환.
        if(currentTask.status === Task.TaskStatus.PROGRESS){
            console.log(`[System] task is already in progress - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        return true
    }

    // Task 시작
    public async startTask(taskId: Task.ITaskIdentity) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();

        currentTask.status = Task.TaskStatus.PROGRESS;
        currentTask.contextId = uuid();
        currentTask.startAt = dateNow;
        currentTask.updatedAt = dateNow;
        currentTask.endAt = null;

        // 최근 로그 maxRecentLogs 수만큼 유지
        // 로그 시작시 새 로그 배열 추가
        // recentLogs 배열 길이 확인 및 오래된 로그 제거
        if(currentTask.recentLogs.length >= this.maxRecentLogs) {
            currentTask.recentLogs.shift();
        }
        if(currentTask.recentLogs.length < this.maxRecentLogs) {
            currentTask.recentLogs.push([]);
        }

        // 로그 추가 및 전송
        const newLog = this.logFormat(taskId, currentTask.contextId, Task.LogLevel.INFO, Task.LogTiming.START, '', dateNow);
        currentTask.recentLogs[currentTask.recentLogs.length - 1].push(newLog);
        this.logTransfer(newLog);
        
        // wsGateway 데이터 전송
        const eventData = {
            taskStates: this.getTaskStatesNoLogs()
        }
        this.wsGateway.emitTaskStateUpdate(eventData);
    }

    // Task 진행 중 로그 추가
    // TODO: data- message수정
    public async logTask(taskId: Task.ITaskIdentity, data: any, logLevel: Task.LogLevel) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();
    
        currentTask.updatedAt = dateNow;
    
        const newLog = this.logFormat(taskId, currentTask.contextId, logLevel, Task.LogTiming.PROCESS, data, dateNow);
        currentTask.recentLogs[currentTask.recentLogs.length - 1].push(newLog);
        if (logLevel === Task.LogLevel.INFO) {
            // Info면 console에 출력 안 함.
            this.logTransferNoConsole(newLog);
        } else {
            this.logTransfer(newLog);
        }
    }

    // Task 종료, taskIdentity로 taskIdx 찾아서 상태 update.
    public async endTask(taskId: Task.ITaskIdentity) {
        const taskIdx = this.findTask(taskId);
        const currentTask = this.taskStates[taskIdx];
        const dateNow = Date.now();

        if(currentTask.taskType === Task.TaskType.CRON){
            // CRON은 waiting
            currentTask.status = Task.TaskStatus.WAITING;
        }else{
            // TRIGGER(WORK)은 terminated
            currentTask.status = Task.TaskStatus.TERMINATED;
        }
        currentTask.updatedAt = dateNow
        currentTask.endAt = dateNow

        const newLog = this.logFormat(taskId, currentTask.contextId, Task.LogLevel.INFO, Task.LogTiming.END, '', dateNow);
        currentTask.recentLogs[currentTask.recentLogs.length - 1].push(newLog);
        this.logTransfer(newLog);

        // wsGateway 데이터 전송
        const eventData = {
            taskStates: this.getTaskStatesNoLogs()
        }
        this.wsGateway.emitTaskStateUpdate(eventData);
    };

    private getTaskState(taskId: Task.ITaskIdentity): Task.TaskStatewithLogs {
        const taskIdx = this.findTask(taskId);
        if(taskIdx === -1){
            return null
        }else{
            return this.taskStates[taskIdx];
        }
    }

    // initial 당시 (domain, task, taskType) 쌍으로 task 찾아주는 helper function
    // return: index
    private findTask(taskId: Task.ITaskIdentity): number {
        const idx = this.taskStates.findIndex(taskState =>
            taskState.domain === taskId.domain
            && taskState.task === taskId.task
            && taskState.taskType === taskId.taskType)
        return idx;
    }

    // TODO: data- any 수정
    private logFormat(taskId: Task.ITaskIdentity, contextId: string, level: Task.LogLevel, timing: Task.LogTiming, data: any, timestamp: number): Task.Log {
        return {
            domain: taskId.domain,
            task: taskId.task,
            taskType: taskId.taskType,
            contextId: { task: contextId },
            level: level,
            logTiming: timing,
            data: data,
            timestamp: timestamp
        }
    }

    private async logTransfer(log: Task.Log) {
        this.logger.pushConsoleLog(log);
        this.logger.pushFileLog(log);
    }

    private async logTransferNoConsole(log: Task.Log){
        this.logger.pushFileLog(log);
    }

    // taskStates에서 recentLogs를 제외하고 return
    private getTaskStatesNoLogs() {
        return this.taskStates.map(taskState => {
            const { recentLogs, ...rest } = taskState;
            return rest;
        })
    }


    public async wsGetCurrentStates(): Promise<TaskStatesNoLogsDTO> {
        return {
            taskStates: this.getTaskStatesNoLogs()
        }
    }

    public async wsGetTaskLogs(taskId: Task.ITaskIdentity): Promise<TaskStateWithSeqLogsDTO> {
        let eventData;
        const taskIdx = this.findTask(taskId);
        if(taskIdx === -1){
            // 찾는 task가 없으면,
            eventData = null;
        }else{
            const currentTask = this.taskStates[taskIdx];
            const lastLogSeq = currentTask.recentLogs[currentTask.recentLogs.length - 1].length - 1;
            eventData = {
                ...currentTask,
                lastLogSeq
            }
        }
        return eventData;
    }

    public async wsGetNewTaskLogs(domain: string, task: string, taskType: Task.TaskType, startLogSeq: number): Promise<TaskStateWithNewLogsDTO> {
        let eventData;
        // console.log(domain, task, taskType, startLogSeq)
        const taskIdx = this.findTask({ domain, task, taskType });
        if(taskIdx === -1){
            // 찾는 task가 없으면,
            eventData = null;
        }else{
            const currentTask = this.taskStates[taskIdx];
            const recentLogIdx = currentTask.recentLogs.length - 1;
            const lastLogSeq = currentTask.recentLogs[recentLogIdx].length;
            if(startLogSeq > lastLogSeq){
                // 요청 Log가 현재 로그보다 크면, context가 꼬인건데...?
                console.log(`[System] Log sequence error - ${domain}:${task}:${taskType}`)
                eventData = null;
            }else{
                const logs = currentTask.recentLogs[recentLogIdx].slice(startLogSeq, lastLogSeq);
                const { recentLogs, ...remain } = currentTask;
                eventData = {
                    ...remain,
                    lastLogSeq,
                    reqLogs: logs
                }
            }
        }
        return eventData;
    }
}
