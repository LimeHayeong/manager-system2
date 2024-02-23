import * as fs from 'fs';

import { GridRequestDTO, GridResultDTO, TaskHistogramDTO } from './dto/task-statistic.dto';
import { Injectable, NotFoundException } from "@nestjs/common";
import { StateFactory, TaskIdentity } from '../types/state.template';

import { LoggerService } from "../logger/logger.service";
import { Task } from "../types/task";
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';

const maxStatisticNumber = 30;

// Q. taskIdx 찾는 과정이 manager랑 같이 있음. 이게 맞을까?
// 인덱스를 아예 동기화시키면 그럴 필요 없기는 함. 일단은 성능에 큰 문제를 주지는 않을 것.
// Q. State로 갖고 있을 거면, 솔직히 파일 뒤적거릴 필요도 없음. 그냥 State에서 찾으면 됨.
@Injectable()
export class ManagerStatistic {
    private statisticState: Task.TaskStatisticState[] = [];
    private maxStatisticNumber: number;

    constructor(
        private readonly logger: LoggerService,
    ) {
        this.initialization();
    }

    private initialization() {
        this.maxStatisticNumber = maxStatisticNumber;

        TaskIdentity.forEach(taskId => this.statisticState.push(StateFactory.createTaskStatisticState(taskId)));

        // intialization할 때 최근 30치 통계 넣어줄까?

        console.log('[System] ManagerStatistic initialized');
    }

    public async startTask(taskId: Task.ITaskIdentity, contextId: string){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            // 시작할 때 데이터 초기화.
            const currentTaskStatistic = this.statisticState[taskIdx]
            currentTaskStatistic.contextId = contextId;
            currentTaskStatistic.data = this.createNewStatisticData();

            // recentStatistics push 관련 로직.
            if(currentTaskStatistic.recentStatistics.length > this.maxStatisticNumber){
                currentTaskStatistic.recentStatistics.shift();
            }
        }
    }

    public async taskLogCountIncrease(taskId: Task.ITaskIdentity, logType: Task.LogLevel){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            const currentTaskStatistic = this.statisticState[taskIdx]
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
            const currentTaskStatistic = this.statisticState[taskIdx]
            const timestamp = Date.now();
            const executionTime = endAt - startAt;

            // 끝날 때 로그 만들어서 recentStatistic에도 넣어주고, logger에도 transfer 해야함.
            const newLog = this.statisticLogFormat(taskId, currentTaskStatistic.data, currentTaskStatistic.contextId, timestamp, executionTime);
            currentTaskStatistic.recentStatistics.push(newLog);

            this.logger.pushStatisticLog(newLog);
        }
    }

    // HTTP CONTEXT
    // TODO: 30개 이상이면 파일 검색 해야하는디.
    public getTaskStatistic(
        data: TaskStatisticRequestDTO
        ): TaskHistogramDTO {
        const { domain, task, taskType, number, from , to } = data;
        const taskIdx = this.findTask({domain, task, taskType});
        // const logFilePath = 'logs/log-statistic.json'
        if(taskIdx === -1){
            throw new NotFoundException(`${domain}:${task}:${taskType}를 찾을 수 없습니다.`)
        }else{
            const currentTaskStatistic = this.statisticState[taskIdx];
            return {
                domain,
                task,
                taskType,
                recentStatistics: currentTaskStatistic.recentStatistics,
            }

            // if(number && from && to){
            //     return await this.readLogsFullFile(
            //         logFilePath,
            //         (log: Task.StatisticLog) => {
            //             return (log.domain === domain
            //                     && log.task === task
            //                     && log.taskType === taskType
            //                     && log.timestamp >= from
            //                     && log.timestamp <= to)
            //         },
            //         number
            //     );
            // } else if(number){
            //     return await this.readLogsFullFile(
            //         logFilePath,
            //         (log: Task.StatisticLog) => {
            //             return (log.domain === domain
            //                     && log.task === task
            //                     && log.taskType === taskType)
            //         },
            //         number
            //     );

            // }
            // return await this.readLogsFullFile(
            //     logFilePath,
            //     (log: Task.StatisticLog) => {
            //         return (log.domain === domain
            //                 && log.task === task
            //                 && log.taskType === taskType)
            //     },
            // );
        }
    }

    public getAllStatistic(): Task.TaskStatisticState[] {
        // 일단 CRON만 전달하는데 맞나?
        return this.statisticState
            .filter(state => state.taskType === Task.TaskType.CRON);
    }

    public async getGrid(data: GridRequestDTO): Promise<GridResultDTO> {
        // TODO: 지금은 상관없는데 파일크기가 커지면 문제 발생할 수 있음.
        // TODO: Log-statistic 작성하는 친구와 Lock mechanism을 잘 활용해야함.
        console.time('Grid');

        const blockNumber = data.blockNumber ? data.blockNumber : 24 * 7;
        const blockSize = data.blockSize ? data.blockSize : 60 * 60 * 1000;

        while(this.logger.getStatisticLogUsing){
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.logger.useStatisticLog();

        const statisticLogFile = fs.readFileSync('logs/log-statistic.json', {encoding: 'utf-8'})
        const logs = statisticLogFile.trim()
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => JSON.parse(line));
            // JSON 배열로 변환 완료
        
        const gridStates = StateFactory.createGrid(TaskIdentity, blockNumber)

        const now = new Date();
        const nowTimestamp = now.getTime();

        const restTime = nowTimestamp % blockSize;
        const firstStart = nowTimestamp - restTime;
        const timeArray = []
        for(let i = 0; i < blockNumber; i++){
            timeArray.push({
                start: firstStart - blockSize * i,
                end: firstStart - blockSize * (i+1),
            })
        }

        logs.forEach(data => {
            const timeDiff = nowTimestamp - data.timestamp;
            if(!(timeDiff <= blockNumber * blockSize)) return;

            const idx = Math.floor(timeDiff / blockSize)
            const currentState = gridStates.find(
                state => state.domain === data.domain
                && state.task === data.task
                && state.taskType === data.taskType
            )

            if(!currentState) return;
                
            currentState.grid[idx].logCount += data.data.logCount;
            currentState.grid[idx].infoCount += data.data.infoCount;
            currentState.grid[idx].warnCount += data.data.warnCount;
            currentState.grid[idx].errorCount += data.data.errorCount;
        })
        
        this.logger.freeStatisticLog();
        console.timeEnd('Grid');
        return {
            time: timeArray,
            grids: gridStates
        }
    }

    private findTask(taskId: Task.ITaskIdentity): number{
        const idx = this.statisticState.findIndex(task => task.domain === taskId.domain && task.task === taskId.task && task.taskType === taskId.taskType);
        return idx;
    }

    private statisticLogFormat(taskId: Task.ITaskIdentity, data: Task.taskStatistic, contextId: string, timestamp: number, executionTime: number): Task.StatisticLog {
        return {
            domain: taskId.domain,
            task: taskId.task,
            taskType: taskId.taskType,
            contextId: contextId,
            data,
            timestamp,
            executionTime,
        }
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
        // const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
        while(this.logger.getStatisticLogUsing){
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.logger.useStatisticLog();

        const fileContent = fs.readFileSync('logs/log-statistic.json', { encoding: 'utf-8' });
        
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

        this.logger.freeStatisticLog();
        return matchingLogs;
    }
}