import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TaskStateWithNewLogsDTO, TaskStateWithSeqLogsDTO } from './dto/task-state.dto';
import { newTasks, newWorks } from './manager.state.template';

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
    private maxRecentLogs;

    constructor(
        private readonly wsGateway: WsReceiveGateway,
        private readonly logger: LoggerService,
        private readonly statistic: ManagerStatistic
    ) {
        this.initialization();
    }

    private initialization() {
        // TODO: snapshot 만들어서 과거 state 복원 로직 추가
        this.maxRecentLogs = maxLogsNumber

        newTasks.forEach(newTask => this.taskStates.push(newTask));
        newWorks.forEach(newWork => this.workStates.push(newWork));

        console.log('[System] ManagerService initialized');
    }

    // Task를 활성화하거나 비활성화함.
    // activate가 true인 경우 활성화, false인 경우 비활성화
    // HTTP context.
    public controlTask(taskId: Task.ITaskIdentity, activate: boolean) {
        const taskIdx = this.findTask(taskId);
        if(taskIdx === -1){
            // 찾는 task가 없으면,
            throw new NotFoundException(`${taskId.domain}:${taskId.task}:${taskId.taskType}를 찾을 수 없습니다.`, )
        }else{
            if(this.taskStates[taskIdx].isAvailable === activate){
                // 이미 활성화/비활성화 되어있으면, 
                throw new BadRequestException(`${taskId.domain}:${taskId.task}:${taskId.taskType}는 이미 ${activate ? '활성화' : '비활성화'} 되어있습니다.`)
            }
            this.taskStates[taskIdx].isAvailable = activate;
        }
    }

    public isActivated(taskId: Task.ITaskIdentity) {
        const taskIdx = this.findTask(taskId);
        if(this.taskStates[taskIdx].isAvailable === false){
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
        if(currentTask == null) { 
            // task가 없으면, false 반환
            // Q. 맞을까? 이러면 미리 다 선언하긴 해야함.
            // console.log(`[System] task not found - ${taskId.domain}:${taskId.task}:${taskId.taskType}`)
            return false;
        }

        if(currentTask.isAvailable === false){
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

        // 로그 추가 및 전송
        let newLog;
        if(workId){
            // work context면,
            newLog = this.logFormat(taskId, { work: workId, task: currentTask.contextId }, Task.LogLevel.INFO, Task.LogTiming.START, null, dateNow);
        }else{
            newLog = this.logFormat(taskId, currentTask.contextId, Task.LogLevel.INFO, Task.LogTiming.START, null, dateNow);
        }
        currentTask.recentLogs[currentTask.recentLogs.length - 1].push(newLog);
        await this.statistic.startTask(taskId);
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
        
        let newLog;
        if(workId){
            // work context면,
            newLog = this.logFormat(taskId, { work: workId, task: currentTask.contextId }, logLevel, Task.LogTiming.PROCESS, data, dateNow);
        }else{
            newLog = this.logFormat(taskId, currentTask.contextId, logLevel, Task.LogTiming.PROCESS, data, dateNow);
        }
        currentTask.recentLogs[currentTask.recentLogs.length - 1].push(newLog);
        await this.statistic.taskLogCountIncrease(taskId, logLevel)
        
        if (logLevel === Task.LogLevel.INFO) {
            // Info면 console에 출력 안 함.
            this.logTransferNoConsole(newLog);
        } else {
            this.logTransfer(newLog);
        }
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

        let newLog;
        if(workId){
            // work context면,
            newLog = this.logFormat(taskId, { work: workId, task: currentTask.contextId }, Task.LogLevel.INFO, Task.LogTiming.END, null, dateNow);
        }else{
            newLog = this.logFormat(taskId, currentTask.contextId, Task.LogLevel.INFO, Task.LogTiming.END, null, dateNow);
        }
        currentTask.recentLogs[currentTask.recentLogs.length - 1].push(newLog);
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
        const currentWork = this.workStates[this.findWork(workId)];
        if(currentWork == null) { 
            // work가 없으면, false 반환
            console.log('no work');
            return false;
        }

        if(currentWork.status === Task.TaskStatus.PROGRESS){
            // work가 실행 중이면, false 반환.
            console.log('work is already in progress');
            return false;
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
        const newLog = this.logFormat({ domain: 'work', task: workId.work, taskType: workId.workType}, currentWork.contextId, Task.LogLevel.INFO, Task.LogTiming.START, null, dateNow);
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
        const newLog = this.logFormat({ domain: 'work', task: workId.work, taskType: workId.workType}, currentWork.contextId, Task.LogLevel.INFO, Task.LogTiming.END, null, dateNow);
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

    private logFormat(taskId: Task.ITaskIdentity, contextId: string | object, level: Task.LogLevel, timing: Task.LogTiming, data: Task.IContext, timestamp: number): Task.Log {
        const log = {
            domain: taskId.domain,
            task: taskId.task,
            taskType: taskId.taskType,
            contextId: null,
            level: level,
            logTiming: timing,
            data: data,
            timestamp: timestamp
        }
        if(typeof contextId === 'string'){
            if(taskId.domain === 'work'){
                log.contextId = { work: contextId }
            }else{
                log.contextId = { task: contextId }
            }
        } else {
            log.contextId = contextId
        }
        return log
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
