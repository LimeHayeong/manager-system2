import * as fs from 'fs';
import * as readline from 'readline';

import { Injectable, NotFoundException } from "@nestjs/common";

import { LoggerService } from "../logger/logger.service";
import { Task } from "../types/task";
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';

const newTaskStatistic: Task.StatisticLog[] = [
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceC',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceC',
        task: 'processHelper',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceD',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
]

const logFilePath = 'logs/log-statistic.json'

// Q. taskIdx 찾는 과정이 manager랑 같이 있음. 이게 맞을까?
// 인덱스를 아예 동기화시키면 그럴 필요 없기는 함. 일단은 성능에 큰 문제를 주지는 않을 것.
@Injectable()
export class ManagerStatistic {
    private taskStatistic: Task.StatisticLog[] = [];

    constructor(
        private readonly logger: LoggerService,
    ) {
        this.initialization();
    }

    private initialization() {
        newTaskStatistic.forEach(newTaskStatistic => this.taskStatistic.push(newTaskStatistic));
    }

    public async startTask(taskId: Task.ITaskIdentity){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            // 시작할 때 데이터 초기화.
            const currentTaskStatistic = this.taskStatistic[taskIdx]
            currentTaskStatistic.data = this.createNewStatisticData();
            currentTaskStatistic.timestamp = null;
            currentTaskStatistic.executionTime = null;
            currentTaskStatistic.data.logCount++;
            currentTaskStatistic.data.infoCount++;
        }
    }

    public async taskLogCountIncrease(taskId: Task.ITaskIdentity, logType: Task.LogLevel){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            const currentTaskStatistic = this.taskStatistic[taskIdx]
            currentTaskStatistic.data.logCount++;
            if(logType === Task.LogLevel.INFO){
                currentTaskStatistic.data.infoCount++;
            } else if(logType === Task.LogLevel.WARN){
                currentTaskStatistic.data.warnCount++;
            } else if(logType === Task.LogLevel.ERROR){
                currentTaskStatistic.data.errorCount++;
            }
        }
    }

    public async endTask(taskId: Task.ITaskIdentity, startAt: number, endAt: number){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            const currentTaskStatistic = this.taskStatistic[taskIdx]
            currentTaskStatistic.timestamp = Date.now();
            currentTaskStatistic.executionTime = endAt - startAt;
            currentTaskStatistic.data.logCount++;
            currentTaskStatistic.data.infoCount++;
            this.logger.pushStatisticLog({
                ...currentTaskStatistic})
        }
    }

    // HTTP CONTEXT
    public async getTaskStatistic(
        data: TaskStatisticRequestDTO
        ): Promise<Task.StatisticLog[]> {
        const { domain, task, taskType, number, from , to } = data;
        const taskIdx = this.findTask({domain, task, taskType});
        if(taskIdx === -1){
            throw new NotFoundException(`${domain}:${task}:${taskType}는 존재하지 않습니다.`)
        }else{
            if(number && from && to){
                return await this.readLogsFullFile(
                    logFilePath,
                    (log: Task.StatisticLog) => {
                        return (log.domain === domain
                                && log.task === task
                                && log.taskType === taskType
                                && log.timestamp >= from
                                && log.timestamp <= to)
                    },
                    number
                );
            } else if(number){
                return await this.readLogsFullFile(
                    logFilePath,
                    (log: Task.StatisticLog) => {
                        return (log.domain === domain
                                && log.task === task
                                && log.taskType === taskType)
                    },
                    number
                );

            }
            return await this.readLogsFullFile(
                logFilePath,
                (log: Task.StatisticLog) => {
                    return (log.domain === domain
                            && log.task === task
                            && log.taskType === taskType)
                },
            );
        }
    }

    private findTask(taskId: Task.ITaskIdentity): number{
        const idx = this.taskStatistic.findIndex(task => task.domain === taskId.domain && task.task === taskId.task && task.taskType === taskId.taskType);
        return idx;
    }

    private createNewStatisticData(): Task.taskStatistic {
        return {
            logCount: 0,
            infoCount: 0,
            warnCount: 0,
            errorCount: 0,
        };
    }

    private async readLogsFullFile(
        filePath: string,
        conditionCheck: (obj: any) => boolean,
        maxResults: number = 30,
    ): Promise<Task.StatisticLog[]> {
        // 파일 전체 내용을 비동기적으로 읽기
        const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
        
        // 파일 내용을 줄바꿈 기준으로 분할하여 배열 생성, 뒤에서부터 검색
        const lines = fileContent.split(/\r?\n/).reverse();
        
        const matchingLogs: Task.StatisticLog[] = [];

        // 각 줄을 순회하면서 JSON 파싱 및 조건 검사
        for (const line of lines) {
            if (line) { // 빈 줄이 아닌 경우에만 처리
                try {
                    const log = JSON.parse(line);
                    if (conditionCheck(log)) {
                        matchingLogs.push(log);
                        if (matchingLogs.length === maxResults) break; // 최대 결과 개수에 도달하면 중단
                    }
                } catch (error) {
                    console.error('Error parsing JSON from line:', error);
                }
            }
        }
        return matchingLogs;
    }
}