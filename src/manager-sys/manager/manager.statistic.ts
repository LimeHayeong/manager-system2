import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline'

import { GridRequestDTO, GridResultDTO, LogQueryDTO, LogQueryResultDTO, Query, TaskHistogramDTO } from './dto/task-statistic.dto';
import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { StateFactory, TaskIdentity } from '../types/state.template';

import { Helper } from '../util/helper';
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
    private pageSize: number = 100;

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

    @Helper.ExecutionTimer
    public async doPattern(query: LogQueryDTO): Promise<LogQueryResultDTO> {
        // contextId들 줬으면 from, to 특정 짓는 로직 추가.

        const { from, to, initial } = query
        if(initial) {
            const { startDate, endDate } = this.setDateRange(+from, +to)
            const dateList = this.createDateHourRangeList(startDate, endDate);
            // console.log(dateList);
            let selectedLogs = [];
            let totalSelectedLogs = 0; // 총 선택된 로그의 수

            const pageInfo: PageInfo[] = [];
            let currentPageNumber = 0;
            let currentPageLineNumber = 0;
            let currentPageInfo: PageInfo;
        
            const pattern = new RegExp(this.createPatternFromQueryData(query));
            for(const dateStr of dateList){
                let length = 0;
        
                const filePath = path.join('logs2', `log-${dateStr}.json`);
                if (fs.existsSync(filePath)) {
                    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
                    const rl = readline.createInterface({
                        input: fileStream,
                        crlfDelay: Infinity
                    });
        
                    let lineNumber = 0;
                    for await (const line of rl) {
                        if (pattern.test(line)) {
                            selectedLogs.push(line);
                            length++;
                            totalSelectedLogs++;

                            if(currentPageNumber === 0){
                                // 첫 페이지 시작
                                currentPageInfo = {
                                    pageNumber: currentPageNumber++,
                                    date: dateStr,
                                    startLine: lineNumber
                                }
                            }
                            currentPageLineNumber++;

                            if(currentPageLineNumber === this.pageSize){
                                pageInfo.push(currentPageInfo);
                                currentPageLineNumber = 0;
                                currentPageInfo = {
                                    pageNumber: currentPageNumber++,
                                    date: dateStr,
                                    startLine: lineNumber+1
                                }
                            }

                        }
                        lineNumber++;
                    }
        
                    rl.close();
                }
        
                // console.log(`${dateStr}: ${length} logs selected`);
            }
            if(currentPageLineNumber > 0){
                pageInfo.push(currentPageInfo)
            }
                
            console.log(`Total logs selected: ${selectedLogs.length}`);
            return {
                query: {},
                meta: {
                    totalLogs: selectedLogs.length,
                    pageInfos: pageInfo,
                },
                logs: [],
            };

            
        } else {
            // 처음 아니고 query에 조건 다 주어지면
            const { pageDate, pageStartLine } = query;

            let selectedLogs = [];

            const pattern = new RegExp(this.createPatternFromQueryData(query))
            let newPageDate = pageDate;
            while(selectedLogs.length < this.pageSize){
                const filePath = path.join('logs2', `log-${newPageDate}.json`);
                if(fs.existsSync(filePath)){
                    const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
                    const rl = readline.createInterface({
                        input: fileStream,
                        crlfDelay: Infinity
                    });

                    let lineNumber = 0;
                    for await(const line of rl){
                        lineNumber++;
                        if(lineNumber >= pageStartLine && pattern.test(line)){
                            selectedLogs.push(JSON.parse(line));
                            if(selectedLogs.length === this.pageSize) break;
                        }
                    }
                    rl.close();
                }
                newPageDate = this.incerementHourlyTimestamp(newPageDate)
            }

            return {
                query: query,
                meta: {
                    initial: false,
                    currentPage: query.pageNumber,
                    pageSize: this.pageSize
                },
                logs: selectedLogs
            }
        }
    }

    private incerementHourlyTimestamp(timestamp: string) {
        // Parse the timestamp into date and hour parts
        const parts = timestamp.split("-");
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const day = parseInt(parts[2], 10);
        const hour = parseInt(parts[3], 10);

        // Create a Date object
        const date = new Date(year, month, day, hour);

        // Increment by one hour
        date.setHours(date.getHours() + 1);

        // Format and return the incremented timestamp
        const incrementedTimestamp = date.getFullYear() + "-"
            + String(date.getMonth() + 1).padStart(2, '0') + "-" // Adjust month back to 1-indexed
            + String(date.getDate()).padStart(2, '0') + "-"
            + String(date.getHours()).padStart(2, '0');

        return incrementedTimestamp;
    }

    public async doPatternWithPagination(query: any) {
        const { pageNumber, pageInfos } = query

        let selectedLogs = [];
        const dateList: string[] = [];
        dateList.push(pageInfos[pageNumber-1].date)
        if(pageInfos[pageNumber-1].date !== pageInfos[pageNumber].date)
            dateList.push(pageInfos[pageNumber].date)
        
        const pattern = new RegExp(this.createPatternFromQueryData(query));
        for(const dateStr of dateList){
            let length = 0

            const filePath = path.join('logs2', `log-${dateStr}.json`);
            const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            for await(const line of rl){
                if(pattern.test(line)){
                    selectedLogs.push(line);
                    length++;
                }
                if(length === this.pageSize) break;
            }
        }
        
        return {
            logs: selectedLogs
        }
    }

    private createPatternFromQueryData(data: Query): string {
        // return "d85212b8-e5ce-40eb-80b3-35a1bf735853|f78647e7-8712-4ab2-a426-8d5d0d14807e|c069a9db-227f-49e9-834c-38a1284ffde3|a4cb186b-aaa1-4cfd-bebf-e346f3cf1656"
        const { domain, task, taskType, contextId, level, chain, from, to } = data;
        let regexString = "";

        // 얘네들은 없앨거임
        if(domain) regexString = this.addRegexString(regexString, [domain])
        if(task) regexString = this.addRegexString(regexString, [task])
        if(taskType) regexString = this.addRegexString(regexString, [taskType])
        // ...
    
        if(contextId) regexString = this.addRegexString(regexString, contextId)
        if(level) regexString = this.addRegexString(regexString, [level.toString()])
        if(chain) regexString = this.addRegexString(regexString, [chain])

        // console.log("regex:", regexString)

        return regexString
    }

    private setDateRange(from?: number, to?: number): { startDate: Date, endDate: Date } {
        const todayTimestamp = new Date().getTime();
        const defaultStartTimestamp = todayTimestamp - (7 * 24 * 60 * 60 * 1000); // 7일 전
    
        // from과 to가 제공되지 않았다면, 기본값(오늘부터 7일 전)을 사용
        const startDateTimestamp = from ? from : defaultStartTimestamp;
        const endDateTimestamp = to ? to : todayTimestamp;
    
        const startDate = new Date(startDateTimestamp);
        const endDate = new Date(endDateTimestamp);
    
        return { startDate, endDate };
    }
    

    private createDateHourRangeList(startDate: Date, endDate: Date): string[] {
        const dateList: string[] = [];
        let currentDateTime = startDate;

        while (currentDateTime <= endDate) {
            const year = currentDateTime.getFullYear();
            const month = String(currentDateTime.getMonth() + 1).padStart(2, '0');
            const day = String(currentDateTime.getDate()).padStart(2, '0');
            const hour = String(currentDateTime.getHours()).padStart(2, '0');
            dateList.push(`${year}-${month}-${day}-${hour}`);
            currentDateTime = new Date(currentDateTime.getTime() + 60 * 60 * 1000);
        }

        return dateList;
    }

    private addRegexString(regex: string, data: string[]): string {
        if (regex.length !== 0) {
            regex += '.*';
        }
        regex += (data.length > 1) ? `(${data.join('|')})` : data[0];
        return regex;
    }
    
    public async setfiles(logFiles?: string[]): Promise<void> {
        logFiles = [
            'log-2024-02-26.json',
            'log-2024-02-27.json',
            'log-2024-02-28.json',
            'log-2024-02-29.json',
            'log-2024-03-01.json',
            'log-2024-03-02.json',
            'log-2024-03-03.json',
            'log-2024-03-04.json',
            'log-2024-03-05.json'
        ]

        for (const logFile of logFiles) {
            const filePath = path.join('logs', logFile);
            const fileContent = await fs.promises.readFile(filePath, { encoding: 'utf-8' });
            const logs = fileContent.split('\n').filter(line => line.trim()).map(line => JSON.parse(line) as LogEntry);
    
            const logsByHour: { [key: string]: LogEntry[] } = {};
    
            for (const log of logs) {
                const date = new Date(log.timestamp);
                const dateHourKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
                
                if (!logsByHour[dateHourKey]) {
                    logsByHour[dateHourKey] = [];
                }
    
                logsByHour[dateHourKey].push(log);
            }
    
            for (const [dateHourKey, logs] of Object.entries(logsByHour)) {
                const outputFilePath = path.join('logs2', `log-${dateHourKey}.json`);
                await fs.promises.writeFile(outputFilePath, logs.map(log => JSON.stringify(log)).join('\n'), { encoding: 'utf-8' });
            }
        }
    }

    public async test3(){
        const logFiles = [
            'log-2024-02-26.json',
            'log-2024-02-27.json',
            'log-2024-02-28.json',
            'log-2024-02-29.json',
            'log-2024-03-01.json',
            'log-2024-03-02.json',
            'log-2024-03-03.json',
            'log-2024-03-04.json',
            'log-2024-03-05.json'
        ]

        for (const logFile of logFiles) {
            
        }
    }
}

interface LogEntry {
    timestamp: number;
    [key: string]: any;
}

interface PageInfo {
    pageNumber: number;
    date: string;
    startLine: number;
}