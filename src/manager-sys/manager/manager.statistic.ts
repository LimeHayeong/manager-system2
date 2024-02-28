import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline'

import { GridRequestDTO, GridResultDTO, LogQueryDTO, LogQueryResultDTO, TaskHistogramDTO } from './dto/task-statistic.dto';
import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { StateFactory, TaskIdentity } from '../types/state.template';

import { LoggerService } from "../logger/logger.service";
import { Task } from "../types/task";
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';

const maxStatisticNumber = 30;

// Q. taskIdx 찾는 과정이 manager랑 같이 있음. 이게 맞을까?
// 인덱스를 아예 동기화시키면 그럴 필요 없기는 함. 일단은 성능에 큰 문제를 주지는 않을 것.
// Q. State로 갖고 있을 거면, 솔직히 파일 뒤적거릴 필요도 없음. 그냥 State에서 찾으면 됨.
@Injectable()
export class ManagerStatistic implements OnModuleInit {
    private statisticState: Task.TaskStatisticState[] = [];
    private maxStatisticNumber: number;

    constructor(
        private readonly logger: LoggerService,
    ) {
    }

    async onModuleInit() {
        await this.asyncIntialization();
    }

    private async asyncIntialization(): Promise<void> {
        // intialization할 때 최근 30치 통계 넣어줄까?
        this.maxStatisticNumber = maxStatisticNumber;

        TaskIdentity.forEach(taskId => this.statisticState.push(StateFactory.createTaskStatisticState(taskId)));
        await this.setInitialStatisticState();

        console.log('[System] ManagerStatistic initialized');

    }

    public async startTask(taskId: Task.ITaskIdentity, contextId: string){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            // 시작할 때 데이터 초기화.
            const currentTaskStatistic = this.statisticState[taskIdx]
            currentTaskStatistic.contextId = contextId;
            currentTaskStatistic.data = this.newData();
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
            const { domain, task, taskType, ...remain } = newLog
            // recentStatistics push 관련 로직.
            if(currentTaskStatistic.recentStatistics.length > this.maxStatisticNumber){
                currentTaskStatistic.recentStatistics.shift();
            }
            currentTaskStatistic.recentStatistics.push({
                ...remain
            });

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
        }
    }

    public getAllStatistic(taskType?: Task.TaskType): Task.TaskStatisticState[] {
        // 일단 CRON만 전달하는데 맞나?
        return this.statisticState
            .filter(state => taskType === undefined || state.taskType === taskType)
            .map(state => {
                return {
                    ...state,
                    recentNumbers: state.recentStatistics.length,
                }
            })
    }

    public async getGrid(data: GridRequestDTO): Promise<GridResultDTO> {
        // TODO: 지금은 상관없는데 파일크기가 커지면 문제 발생할 수 있음.
        // TODO: Log-statistic 작성하는 친구와 Lock mechanism을 잘 활용해야함.

        const blockNumber = data.blockNumber ? data.blockNumber : 24 * 7;
        const blockSize = data.blockSize ? data.blockSize : 60 * 60 * 1000;

        while(this.logger.getStatisticLogUsing()){
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
        for(let i = 0; i < TaskIdentity.length; i++){
            for(let j = 0; j < blockNumber; j++){
                gridStates[i].grid[j].start = firstStart - blockSize * j;
                gridStates[i].grid[j].end = firstStart - blockSize * (j+1);
            }
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
            currentState.grid[idx].contextIds.push(data.contextId);
        })
        
        this.logger.freeStatisticLog();

        return {
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

    private newData(): Task.taskStatistic {
        return {
            logCount: 0,
            infoCount: 0,
            warnCount: 0,
            errorCount: 0
        }
    }

    private createDateRangeList(startDate: Date, endDate: Date): string[] {
        const dateList: string[] = [];
        let currentDate = new Date(startDate.toISOString().split('T')[0]); // 시작 날짜의 "YYYY-MM-DD" 부분만 사용하여 날짜 객체 생성
        const end = new Date(endDate.toISOString().split('T')[0]); // 종료 날짜의 "YYYY-MM-DD" 부분만 사용하여 날짜 객체 생성
    
        while (currentDate <= end) {
            dateList.push(currentDate.toISOString().split('T')[0]);
            // 현재 날짜에 1일 추가
            currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1));
        }
    
        return dateList;
    }

    private createFilterFunction(data: LogQueryDTO){
        const { domain, task, taskType, contextId, level, chain, from, to} = data;
        return (log: Task.Log) => {
            if (domain && log.domain !== domain) return false;
            if (task && log.task !== task) return false;
            if (taskType && log.taskType !== taskType) return false;
            if (contextId && !this.contextIdMatches(contextId, log.contextId)) return false;
            if (level && log.level !== level) return false;
            if (chain && log.data.chain !== chain) return false;
            if (from && log.timestamp < from) return false;
            if (to && log.timestamp > to) return false;
            return true;
        }
    }

    private contextIdMatches(searchContextIds: string[], logContextId: Task.LogContextId): boolean {
        // logContextId 객체 내의 task와 work 값이 searchContextIds 배열에 하나라도 존재하는지 확인
        const { task, work } = logContextId;
        // task 또는 work 값이 searchContextIds 배열에 포함되어 있는지 확인
        return !!((task && searchContextIds.includes(task)) || (work && searchContextIds.includes(work)));
    }

    private async setInitialStatisticState() {
        while(this.logger.getStatisticLogUsing()){
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        this.logger.useStatisticLog();

        const fileContent = fs.readFileSync('logs/log-statistic.json', { encoding: 'utf-8' });
        const lines = fileContent.split(/\r?\n/).reverse();

        for(const line of lines){
            if(line){
                try {
                    const log = JSON.parse(line);
                    // console.log(log);
                    const taskIdx = this.findTask({ domain: log.domain, task: log.task, taskType: log.taskType})
                    if(taskIdx !== -1){
                        const currentTaskStatistic = this.statisticState[taskIdx]
                        if(currentTaskStatistic.recentStatistics.length < this.maxStatisticNumber){
                            currentTaskStatistic.recentStatistics.push({
                                contextId: log.contextId,
                                data: log.data,
                                timestamp: log.timestamp,
                                executionTime: log.executionTime,
                            });
                        }
                    }
                } catch (error) {

                }
            }
        }

        this.logger.freeStatisticLog();

        // queue가 아닌 1차원 배열이라 해당 과정 수행해야함...
        this.statisticState.map(state => {
            state.recentStatistics = state.recentStatistics.reverse();
        })

        // this.statisticState.map(
        //     state => state.recentStatistics.map(
        //         log => console.log(log)
        //     )
        // )
    }

    private async readLogFile(
        filePath: string,
        conditionCheck: (log: Task.Log) => boolean,
        // maxResults: number = 9999,
    ): Promise<Task.Log[]> {
        const matchingLogs: Task.Log[] = [];
        let buffer = '';
        let lines = [];

        const processLines = (lines: string[]) => {
            for (const line of lines) {
                try {
                    const log: Task.Log = JSON.parse(line);
                    if (conditionCheck(log)) {
                        matchingLogs.push(log);
                        // if (matchingLogs.length >= maxResults) {
                        //     return; // 최대 결과에 도달하면 처리 중단
                        // }
                    }
                } catch (error) {
                    console.error('Error parsing JSON from line:', error);
                }
            }
        };

        const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });

        for await (const chunk of fileStream) {
            buffer += chunk;
            let pos;
            while ((pos = buffer.indexOf('\n')) >= 0) {
                lines.push(buffer.substring(0, pos));
                buffer = buffer.substring(pos + 1);

                if (lines.length >= 100) {
                    processLines(lines);
                    lines = [];
                }
            }
        }

        // 남은 줄 처리
        if (buffer) {
            lines.push(buffer); // 마지막 부분에 줄바꿈이 없는 경우 처리
        }
        if (lines.length > 0) {
            processLines(lines);
        }

        return matchingLogs;
    }

    // private async readLogFileTest(
    //     filePath: string,
    //     conditionCheck: (log: Task.Log) => boolean,
    // ): Promise<Task.Log[]> {
    //     // First, identify positions of logs that match the condition
    //     const positions = await this.identifyLogPositions(filePath, conditionCheck);
      
    //     const matchingLogs: Task.Log[] = [];
      
    //     // Read and parse logs based on identified positions
    //     for (const position of positions) {
    //       const logData = await this.readLogAtPosition(filePath, position.start, position.end);
    //       matchingLogs.push(logData);
    //     }
      
    //     return matchingLogs;
    // }

    public async queryLog(data: LogQueryDTO): Promise<LogQueryResultDTO> {
        const { from, to, pageNumber = 6, pageSize = 1000 } = data;
        const dateList = this.createDateRangeList(new Date(+from), new Date(+to));
        let selectedLogs: Task.Log[] = [];
        let totalProcessedLogs = 0; // 전체 처리된 로그의 수
        const requiredStart = pageNumber * pageSize;
        const requiredEnd = (pageNumber + 1) * pageSize;
    
        for (const dateStr of dateList) {
            if (selectedLogs.length >= pageSize) break; // 필요한 로그 수를 충족했다면 종료
    
            const filePath = path.join('logs', `log-${dateStr}.json`);
            if (fs.existsSync(filePath)) {
                const { positions, processedLogs } = await this.identifyLogPositions(filePath, this.createFilterFunction(data), requiredStart - totalProcessedLogs, requiredEnd - totalProcessedLogs);
                console.log(positions.length)
                totalProcessedLogs += processedLogs; // 총 처리된 로그 수 업데이트
    
                await this.readSelectedLogs(filePath, positions, selectedLogs, pageSize);
            }
        }
    
        return {
            logscount: selectedLogs.length,
            logs: selectedLogs
        };
    }
    
    private async readSelectedLogs(filePath: string, positions: number[], selectedLogs: Task.Log[], pageSize: number): Promise<void> {
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
        const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
        
        let lineNumber = 0;
        for await (const line of rl) {
            if (positions.includes(lineNumber)) {
                try {
                    const log = JSON.parse(line);
                    selectedLogs.push(log);
                    if (selectedLogs.length >= pageSize) break; // 필요한 로그 수를 충족했다면 종료
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
            }
            lineNumber++;
        }
    
        rl.close();
    }
    
    private async identifyLogPositions(filePath: string, conditionCheck: (log: Task.Log) => boolean, rangeStart: number, rangeEnd: number): Promise<{positions: number[], processedLogs: number}> {
        const positions: number[] = [];
        let lineNumber = 0;
        let accumulatedLines = '';
        let processedLogs = 0;
    
        const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8', highWaterMark: 64 * 1024 });
    
        for await (const chunk of fileStream) {
            accumulatedLines += chunk;
            let lineEndIndex = 0;
    
            while ((lineEndIndex = accumulatedLines.indexOf('\n')) !== -1) {
                const line = accumulatedLines.slice(0, lineEndIndex);
                accumulatedLines = accumulatedLines.slice(lineEndIndex + 1);
    
                try {
                    const log: Task.Log = JSON.parse(line);
                    if (conditionCheck(log)) {
                        processedLogs++;
                        if (processedLogs > rangeStart && processedLogs <= rangeEnd) {
                            positions.push(lineNumber);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                }
                lineNumber++;
                if (processedLogs >= rangeEnd) break;
            }
    
            if (processedLogs >= rangeEnd) break;
        }
    
        return { positions, processedLogs };
    }
       
}