import { CategoryCount, GridRequestDTO, GridResultDTO, LogQueryDTO, LogQueryResultDTO, Query, TaskHistogramDTO, pageInfo } from './dto/task-statistic.dto';
import { Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { StateFactory, TaskIdentity } from '../types/state.template';

import { FileService } from '../file/file.service';
import { Helper } from '../util/helper';
import { LoggerService } from '../logger/logger.service';
import { Task } from "../types/task";
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';

// TODO: Configuration
const maxStatisticNumber = 30;
const pageSize = 100;
const defaultGridBlockNumber = 24 * 7; // 24시간, 7일
const defaultGridBlockSize = 60 * 60 * 1000; // 1시간.

@Injectable()
export class ManagerStatistic implements OnModuleInit {
    private statisticState: Task.TaskStatisticState[] = [];
    private maxStatisticNumber: number;
    private pageSize: number;

    constructor(
        private readonly logger: LoggerService,
        private readonly fileService: FileService,
    ) {
    }

    async onModuleInit() {
        await this.asyncIntialization();
    }

    private async asyncIntialization(): Promise<void> {
        // intialization할 때 최근 30치 통계 넣어줄까?
        this.maxStatisticNumber = maxStatisticNumber;
        this.pageSize = pageSize;

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
    @Helper.ExecutionTimerSync
    public getTaskStatistic(
        data: TaskStatisticRequestDTO
        ): TaskHistogramDTO {
        const { domain, task, taskType, number, from , to } = data;
        const taskIdx = this.findTask({domain, task, taskType});
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

    @Helper.ExecutionTimerSync
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

    @Helper.ExecutionTimerAsync
    public async getGrid(data: GridRequestDTO): Promise<GridResultDTO> {
        // TODO: 지금은 상관없는데 파일크기가 커지면 문제 발생할 수 있음.
        // TODO: Log-statistic 작성하는 친구와 Lock mechanism을 잘 활용해야함.

        const blockNumber = data.blockNumber ? data.blockNumber : defaultGridBlockNumber;
        const blockSize = data.blockSize ? data.blockSize : defaultGridBlockSize;

        const logs = await this.fileService.getStatisticLogsToJson()
        
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
        
        // file lock 해제
        this.fileService.freeFile(this.fileService.getStatisticLogFileName());

        return {
            grids: gridStates
        }
    }

    @Helper.ExecutionTimerAsync
    public async doPattern(query: LogQueryDTO): Promise<LogQueryResultDTO> {
        const { querydata, meta} = this.parseLogQuery(query);
        const { initial } = meta
        let result;
        if(initial){
            const fromTo = await this.contextIdToFromTo(querydata.contextId);
            // console.log('doPattern-', fromTo);
            // fromTo가 undefined가 아니면 fromTo의 값으로 initialQuerySearch를 호출
            result = fromTo !== undefined ?
                await this.initialQuerySearch(query, fromTo.from.toString(), fromTo.to.toString()) :
                await this.initialQuerySearch(query);
        }else{
            result = await this.paginationQuerySearch(query);
        }   
        return result;
    }

    private findTask(taskId: Task.ITaskIdentity): number{
        const idx = this.statisticState.findIndex(task => task.domain === taskId.domain && task.task === taskId.task && task.taskType === taskId.taskType);
        return idx;
    }

    // statistic state를 statistic log로 포맷팅하는 함수.
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

    // task state 새로 반영할 때 새로운 객체 생성하는 함수
    private newData(): Task.taskStatistic {
        return {
            logCount: 0,
            infoCount: 0,
            warnCount: 0,
            errorCount: 0
        }
    }

    private async setInitialStatisticState() {
        const logs = await this.fileService.getStatisticLogsToJson()

        for(let i = logs.length - 1; i >= 0; i--){
            const log = logs[i]
            const taskIdx = this.findTask({ domain: log.domain, task: log.task, taskType: log.taskType})
            // task 없으면 생략
            if(taskIdx === -1) continue;

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

        // file lock 해제
        this.fileService.freeFile(this.fileService.getStatisticLogFileName())

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

    private async initialQuerySearch(query: LogQueryDTO, from?: string, to?: string): Promise<LogQueryResultDTO>{
        const { querydata, meta } = this.parseLogQuery(query);
        let fromN = from ?? querydata.from?.toString();
        let toN = to ?? querydata.to?.toString();

        const { startDate, endDate } = this.setDateRange(+fromN, +toN)
        const dateList = this.createDateHourRangeList(startDate, endDate);
        // console.log(dateList);
        let selectedLogs = [];
        let totalSelectedLogs = 0; // 총 선택된 로그의 수

        const pageInfo: pageInfo[] = [];
        let currentPageNumber = 1;
        let currentPageLineNumber = 0;
        let currentPageInfo: pageInfo;
    
        const pattern = new RegExp(this.createPatternFromQueryData(querydata));
        for(const dateStr of dateList){
    
            // 파일이름으로 FileStream 만들어줌.
            const rl = this.fileService.getReadLineByFileName(`log-${dateStr}.json`);
            // fileStream 못 만들면 넘어감.
            if(!rl) {
                continue;
            }

            let lineNumber = 0;
            let length = 0;
            for await (const line of rl) {
                if(!pattern.test(line)) continue;

                selectedLogs.push(line);
                totalSelectedLogs++;
                length++;

                if(currentPageNumber === 1){
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

                lineNumber++;
            }
    
            rl.close();
            // console.log(`${dateStr}: ${length} logs selected`);
        }
        if(currentPageLineNumber > 0){
            pageInfo.push(currentPageInfo)
        }

        // 카테고리별로 집계하는 로직
        const categoryCounts = this.aggregateCategories(selectedLogs);
            
        console.log(`Total logs selected: ${totalSelectedLogs}`);
        const parsedLogs = selectedLogs
            .slice(0, this.pageSize)
            .map(log => JSON.parse(log))
        return {
            query: querydata,
            meta: {
                initial: false,
                currentPageInfo: meta.currentPageInfo,
            },
            logs: parsedLogs
        };
    }

    private async paginationQuerySearch(query: LogQueryDTO): Promise<LogQueryResultDTO>{
        // 처음 아니고 query에 조건 다 주어지면
        const { querydata, meta } = this.parseLogQuery(query);
        const { requestPageInfo } = meta;
        const { date, startLine } = requestPageInfo;

        let selectedLogs = [];

        const pattern = this.createPatternFromQueryData(querydata)
        let newPageDate = date;
        while(selectedLogs.length < this.pageSize){
            // 파일이름으로 FileStream 만들어주고, 못 만들면 루프 탈출함.
            const rl = this.fileService.getReadLineByFileName(`log-${newPageDate}.json`);
            if(!rl) break;

            let lineNumber = 0;
            for await(const line of rl){
                lineNumber++;
                if(lineNumber >= startLine && pattern.test(line)){
                    selectedLogs.push(JSON.parse(line));
                    if(selectedLogs.length === this.pageSize) break;
                }
            }
            rl.close();
                
            newPageDate = this.incerementHourlyTimestamp(newPageDate)
        }

        return {
            query: querydata,
            meta: {
                initial: false,
                totalLength: meta.totalLength,
                pageSize: this.pageSize,
                currentPageInfo: meta.requestPageInfo,
                category: meta.category,
                pageInfos: meta.pageInfos
            },
            logs: selectedLogs
        }
    }

    // TODO: 카테고리 확장성있게 로직 변경
    @Helper.ExecutionTimerSync
    private aggregateCategories(logs: string[]): CategoryCount {
        const categoryCounts: CategoryCount = {};
        logs.forEach(log => {
            const logObj = JSON.parse(log);
            
            // 기본 카테고리 집계
            this.aggregateBasicCategories(categoryCounts, logObj, ['domain', 'task', 'taskType', 'level']);
    
            // contextId 집계
            if (logObj.contextId) {
                this.aggregateNestedCategories(categoryCounts, 'contextId', logObj.contextId, ['work', 'task']);
            }
    
            // data.chain 집계
            if (logObj.data?.chain) {
                this.aggregateNestedCategories(categoryCounts, 'data', logObj.data, ['chain']);
            }
        });
    
        return categoryCounts;
    }
    
    // 기본 카테고리 집계 함수
    private aggregateBasicCategories(categoryCounts: CategoryCount, logObj: any, categories: string[]) {
        categories.forEach(category => {
            const value = logObj[category];
            if (value) {
                categoryCounts[category] = categoryCounts[category] ?? {};
                categoryCounts[category][value] = (categoryCounts[category][value] as number || 0) + 1;
            }
        });
    }
    
    // 중첩된 카테고리 집계 함수
    private aggregateNestedCategories(categoryCounts: CategoryCount, categoryName: string, nestedObj: any, subCategories: string[]) {
        subCategories.forEach(subCategory => {
            const value = nestedObj[subCategory];
            if (value) {
                categoryCounts[categoryName] = categoryCounts[categoryName] ?? {};
                let nestedCategory = categoryCounts[categoryName][subCategory] as any;
                nestedCategory = nestedCategory ?? {};
                nestedCategory[value] = (nestedCategory[value] ?? 0) + 1;
                categoryCounts[categoryName][subCategory] = nestedCategory;
            }
        });
    }

    private async contextIdToFromTo(contextId: string | string[]): Promise<{from: number, to: number}> {
        // console.log(contextId);
        // contextId가 null값이면,
        if(!contextId) return undefined;

        const logsRl = await this.fileService.getReadLineByFileName(
            this.fileService.getStatisticLogFileName()
        )
        let contextIdA = Array.isArray(contextId) ? contextId : [contextId];
        const qContextId: Query = {
            contextId: contextIdA
        }
        // console.log(qContextId);
        const pattern = this.createPatternFromQueryData(qContextId);
        let selectedLog: Task.StatisticLog;
        for await (const line of logsRl) {
            if(pattern.test(line)){
                selectedLog = JSON.parse(line);
            }
        }
        if(selectedLog){
            return {
                from: selectedLog.timestamp - selectedLog.executionTime - 1000 * 60 * 5,
                to: selectedLog.timestamp
            }
        }else{
            return undefined
        }
    }

    // Timestamp 증가함수, 파일 순회용.
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

    private createPatternFromQueryData(data: Query): RegExp {
        const { domain, task, taskType, contextId, level, chain, from, to } = data;
        let regexString = "";

        // 순차 적용이라 속도가 그렇게 느리지 않음.
        if(domain) regexString = this.addRegexString(regexString, [domain])
        if(task) regexString = this.addRegexString(regexString, [task])
        if(taskType) regexString = this.addRegexString(regexString, [taskType])
        if(contextId) (typeof contextId === 'string') ? 
            regexString = this.addRegexString(regexString, [contextId]) :
            regexString = this.addRegexString(regexString, contextId)
        if(level) regexString = this.addRegexString(regexString, [level.toString()])
        if(chain) regexString = this.addRegexString(regexString, [chain])

        // console.log("regex:", regexString)

        return new RegExp(regexString)
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

    private parseLogQuery(query: LogQueryDTO) {
        const { domain, task, taskType, contextId, level, chain, from, to } = query;
        const { initial, totalLength, pageSize, currentPageInfo, requestPageInfo, category, pageInfos } = query;
        return {
            querydata: {
                domain,
                task,
                taskType,
                contextId,
                level,
                chain,
                from,
                to
            },
            meta: {
                initial,
                totalLength,
                pageSize,
                currentPageInfo,
                requestPageInfo,
                category,
                pageInfos
            }
        }
    }
}

