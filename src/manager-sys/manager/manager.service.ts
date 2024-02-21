import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { StateFactory, TaskIdentity, WorkIdentity } from '../types/state.template';
import { TaskStateWithNewLogsDTO, TaskStateWithSeqLogsDTO } from './dto/task-state.dto';

import { LoggerService } from '../logger/logger.service';
import { ManagerStatistic } from './manager.statistic';
import { Task } from '../types/task';
import { TaskStatesNoLogsDTO } from './dto/task-states.dto';
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';
import { WsReceiveGateway } from 'src/ws/receive/ws.receive.gateway';
import { v4 as uuid } from 'uuid'

// TODO: Configuration
const maxLogsNumber = 3;

@Injectable()
export class ManagerService {
    private taskStates: Task.TaskStatewithLogs[] = [];
    private workStates: Task.WorkState[] = [];
    private maxRecentLogs: number;

    constructor(
        private readonly wsGateway: WsReceiveGateway,
        private readonly logger: LoggerService,
        private readonly statistic: ManagerStatistic
    ) {
        this.initialization();
    }

    private initialization() {
        this.maxRecentLogs = maxLogsNumber

        TaskIdentity.forEach(taskId => this.taskStates.push(StateFactory.createTaskState(taskId)));
        WorkIdentity.forEach(workId => this.workStates.push(StateFactory.createWorkState(workId)));

        console.log('[System] ManagerService initialized');
    }

    private 

    // Task를 활성화하거나 비활성화함.
    // activate가 true인 경우 활성화, false인 경우 비활성화
    // HTTP context.
    public controlTask(taskId: Task.ITaskIdentity, activate: boolean) {
        const taskIdx = this.findTask(taskId);
        if(taskIdx === -1){
            // 찾는 task가 없으면,
            throw new NotFoundException(`${taskId.domain}:${taskId.task}:${taskId.taskType}를 찾을 수 없습니다.`, )
        }
        if(this.taskStates[taskIdx].isAvailable === activate){
            // 이미 활성화/비활성화 되어있으면, 
            throw new BadRequestException(`${taskId.domain}:${taskId.task}:${taskId.taskType}는 이미 ${activate ? '활성화' : '비활성화'} 되어있습니다.`)
        }
        this.taskStates[taskIdx].isAvailable = activate;
    }

    public isActivated(taskId: Task.ITaskIdentity) {
        const taskIdx = this.findTask(taskId);
        if(!this.taskStates[taskIdx].isAvailable){
            throw new BadRequestException(`${taskId.domain}:${taskId.task}:${taskId.taskType}는 비활성화 되어있습니다.`)
        }
    }

    // HTTP Context.
    public isRunning(taskId: Task.ITaskIdentity) {
        const taskIdx = this.findTask(taskId);
        if(this.taskStates[taskIdx].status === Task.TaskStatus.PROGRESS){
            throw new BadRequestException(`${taskId.domain}:${taskId.task}:${taskId.taskType}는 이미 실행 중입니다.`)
        }
    }

    // HTTP Context.
    public isValidTask(taskId: Task.ITaskIdentity) {
        const taskIdx = this.findTask(taskId);
        if(taskIdx === -1){
            throw new NotFoundException(`${taskId.domain}:${taskId.task}:${taskId.taskType}를 찾을 수 없습니다.`);
        }
    }

    // Task를 시작하기 전에 실행 가능한지 확인하는 함수.
    public async buildTask(taskId: Task.ITaskIdentity): Promise<boolean> {
        // Task 유효성 검사, build level에 문제가 없으면 향후에는 검사 안 함. (고정된 값을 쓰기 때문)
        const currentTask = this.getTaskState(taskId);
        if(!currentTask) { 
            // task가 없으면, false 반환
            // Q. 맞을까? 이러면 미리 다 선언하긴 해야함.
            // console.log(`[System] task not found - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        if(!currentTask.isAvailable){
            // task가 실행 불가능하면, false 반환.
            // console.log(`[System] task is not available - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        // task가 실행 중이면, false 반환.
        if(currentTask.status === Task.TaskStatus.PROGRESS){
            // console.log(`[System] task is already in progress - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        return true
    }

    // Task 시작
    public async startTask(taskId: Task.ITaskIdentity, workId?: string) {
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

        // 로그 추가
        const logContext = this.logContextFormat(currentTask.contextId, workId);
        const newLog = this.logFormat(taskId, logContext, Task.LogLevel.INFO, {message: 'start'}, dateNow);
        this.pushLogToTask(currentTask, newLog);

        // 로그 통계 추가 및 전송
        if(workId){
            await this.statistic.startTask(taskId, workId);
        }else{
            await this.statistic.startTask(taskId, currentTask.contextId);
        }
        
        this.logTransfer(newLog);
        
        // wsGateway 데이터 전송
        const eventData = {
            taskStates: this.getTaskStatesNoLogs(),
            workStates: this.getWorkStateswithTasksNoLogs()
        }
        this.wsGateway.emitTaskStateUpdate(eventData);
    }

    // Task 진행 중 로그 추가
    public async logTask(taskId: Task.ITaskIdentity, data: any, logLevel: Task.LogLevel, workId?: string) {
        const currentTask = this.getTaskState(taskId);
        const dateNow = Date.now();
    
        currentTask.updatedAt = dateNow;
        
        // 로그 추가
        const logContext = this.logContextFormat(currentTask.contextId, workId);
        const newLog = this.logFormat(taskId, logContext, logLevel, data, dateNow);
        this.pushLogToTask(currentTask, newLog)
        
        // 로그 통계 추가 및 전송
        await this.statistic.taskLogCountIncrease(taskId, logLevel)
        this.logTransfer(newLog);
    }

    // Task 종료, taskIdentity로 taskIdx 찾아서 상태 update.
    public async endTask(taskId: Task.ITaskIdentity, workId?: string) {
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

        // 로그 추가
        const logContext = this.logContextFormat(currentTask.contextId, workId);
        const newLog = this.logFormat(taskId, logContext, Task.LogLevel.INFO, { message: 'end'}, dateNow);
        this.pushLogToTask(currentTask, newLog)

        // 로그 통계 추가 및 전송
        await this.statistic.endTask(taskId, currentTask.startAt, currentTask.endAt);
        this.logTransfer(newLog);

        // wsGateway 데이터 전송
        const eventData = {
            taskStates: this.getTaskStatesNoLogs(),
            workStates: this.getWorkStateswithTasksNoLogs()
        }
        this.wsGateway.emitTaskStateUpdate(eventData);
    };

    public async buildWork(workId: Task.IWorkIdentity): Promise<boolean> {
        const workIdx = this.findWork(workId);
        if(workIdx === -1){
            console.log('no work');
            return false;
        }else{
            if(this.workStates[workIdx].status === Task.TaskStatus.PROGRESS){
                console.log('work is already in progress');
                return false;
            }
        }

        return true
    }

    public async startWork(workId: Task.IWorkIdentity, contextId: string) {
        const workIdx = this.findWork(workId);
        const currentWork = this.workStates[workIdx];
        const dateNow = Date.now();

        currentWork.status = Task.TaskStatus.PROGRESS;
        currentWork.contextId = contextId;
        currentWork.startAt = dateNow;
        currentWork.updatedAt = dateNow;
        currentWork.endAt = null;

        // 로그 전송
        const newLog = this.logFormat({ domain: 'work', task: workId.work, taskType: workId.workType}, {work: contextId}, Task.LogLevel.INFO, {message: 'start'}, dateNow);
        // TODO: statistic 추가.
        // Q. 과연필요할까? 그냥 statistic에서 병합하는 게 나을 듯.
        this.logTransfer(newLog);

        // wsGateway 전송
        const eventData = {
            taskStates: this.getTaskStatesNoLogs(),
            workStates: this.getWorkStateswithTasksNoLogs()
        }
        this.wsGateway.emitTaskStateUpdate(eventData);
    }

    public async endWork(workId: Task.IWorkIdentity) {
        const workIdx = this.findWork(workId);
        const currentWork = this.workStates[workIdx];
        const dateNow = Date.now();

        currentWork.status = Task.TaskStatus.TERMINATED;
        currentWork.updatedAt = dateNow;
        currentWork.endAt = dateNow;

        // 로그 전송
        const newLog = this.logFormat({ domain: 'work', task: workId.work, taskType: workId.workType}, {work: currentWork.contextId}, Task.LogLevel.INFO, {message: 'end'}, dateNow);
        // TODO: statistic 추가.
        // Q. 과연필요할까? 그냥 statistic에서 병합하는 게 나을 듯.
        this.logTransfer(newLog);
        
        // wsGateway 전송
        const eventData = {
            taskStates: this.getTaskStatesNoLogs(),
            workStates: this.getWorkStateswithTasksNoLogs()
        }
        this.wsGateway.emitTaskStateUpdate(eventData);
    }

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
        return this.taskStates.findIndex(taskState =>
            taskState.domain === taskId.domain
            && taskState.task === taskId.task
            && taskState.taskType === taskId.taskType)
    }

    // initial 당시 (work, workType) 쌍으로 work 찾아주는 helper function
    // return: index
    private findWork(WorkId: Task.IWorkIdentity): number {
        return this.workStates.findIndex(workState =>
            workState.work === WorkId.work
            && workState.workType === WorkId.workType)
    }

    private pushLogToTask(task: Task.TaskStatewithLogs, log: Task.Log) {
        task.recentLogs[task.recentLogs.length - 1].push(log);
    }

    private logContextFormat(taskId: string, workId?: string): Task.LogContextId{
        if(workId){
            return {
                task: taskId,
                work: workId
            }
        }
        return {
            task: taskId
        }
    }

    private logFormat(taskId: Task.ITaskIdentity, contextId: object, level: Task.LogLevel, data: Task.IContext, timestamp: number): Task.Log {
        const log = {
            domain: taskId.domain,
            task: taskId.task,
            taskType: taskId.taskType,
            contextId: contextId,
            level: level,
            data: data,
            timestamp: timestamp
        }
        return log
    }

    private async logTransfer(log: Task.Log) {
        if(log.level !== Task.LogLevel.INFO || log.data.message === 'start' || log.data.message === 'end'){
            this.logger.pushConsoleLog(log);
        }
        this.logger.pushFileLog(log);
    }
    
    // taskStates에서 recentLogs를 제외하고 return
    private getTaskStatesNoLogs() {
        return this.taskStates
            // .filter(taskState => taskState.taskType !== Task.TaskType.WORK)
            .map(taskState => {
                const { recentLogs, ...rest } = taskState;
                return rest;
            });
    }

    // workStates에 recentLogs를 제외한 taskList(taskStates)를 추가해서 return
    private getWorkStateswithTasksNoLogs() {
        return this.workStates.map(workState => {
            const taskList = workState.taskList.map(task => {
                const { recentLogs, ...rest } = this.getTaskState(task);
                return rest;
            })
            return {
                ...workState,
                taskList
            }
        })
    }


    public async wsGetCurrentStates(): Promise<TaskStatesNoLogsDTO> {
        return {
            taskStates: this.getTaskStatesNoLogs(),
            workStates: this.getWorkStateswithTasksNoLogs()
        }
    }

    public async wsGetTaskLogs(taskId: Task.ITaskIdentity): Promise<TaskStateWithSeqLogsDTO> {
        let eventData;
        const taskIdx = this.findTask(taskId);
        if(taskIdx === -1){
            // 찾는 task가 없으면,
            throw new Error(`${taskId.domain}:${taskId.task}:${taskId.taskType}를 찾을 수 없습니다.`)
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
        const taskIdx = this.findTask({ domain, task, taskType });
        if(taskIdx === -1){
            // 찾는 task가 없으면,
            throw new Error(`${domain}:${task}:${taskType}를 찾을 수 없습니다.`)
        }else{
            const currentTask = this.taskStates[taskIdx];
            const recentLogIdx = currentTask.recentLogs.length - 1;
            const lastLogSeq = currentTask.recentLogs[recentLogIdx].length;
            if(startLogSeq > lastLogSeq){
                // 요청 Log가 현재 로그보다 크면, context가 꼬인건데...?
                throw new Error(`요청 Log seq number가 현재 로그보다 큽니다.`)
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

    public async getTaskStatistic(
        data: TaskStatisticRequestDTO
    ): Promise<Task.StatisticLog[]> {
        return await this.statistic.getTaskStatistic(data);
    }
}
