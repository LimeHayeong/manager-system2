import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { ILogDoc } from '../database/dto/log.interface';
import { Model } from 'mongoose';
import { IExeStatisticDoc, ITimeStatisticDoc } from '../database/dto/statistic.interface';
import { TaskId } from '../types/taskId';
import { LogQuerybyContextIdData, LogQuerybyTaskIdData, LogResultDTO, RecentLogQueryDTO, ResultLog } from './dto/log-query.dto';
import { QueryBuilder } from '../database/queries/mongodb.query.builder';
import { Cron } from '@nestjs/schedule';

const difference: number = 1000 * 60 * 60 * 1;
const expireRange: number = 1000 * 60 * 60 * 24 * 30;

@Injectable()
export class LogService implements OnModuleInit {
    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
        @Inject('EXE_STATISTIC_MODEL')
        private exeStatisticModel: Model<IExeStatisticDoc>,
        @Inject('TIME_STATISTIC_MODEL')
        private timeStatisticModel: Model<ITimeStatisticDoc>,
    ) {
    }

    async onModuleInit() {
        // await this.getRecentLogs({
        //     domain: 'DomainA',
        //     service: 'SecondService',
        //     exeType: 'CRON',
        // });
        // await this.getLogsByTaskId({
        //     domain: 'DomainA',
        //     chain: ['Chain_52', 'Chain_35'],
        //     from: 0,
        //     to: 2000000000000,
        // })
        // await this.getLogByContextIds({
        //     contextId: ['0t-d5b9c90c-5d35-4b54-acdb-f237b03cf2bc', '0t-30690c27-5b6f-4a0c-8b3a-d7d8cf6dcc94'],
        //     from: 0,
        //     to: 2000000000000,
        // });
    }

    // 30일 지난 로그 삭제
    // 6시간마다 1시 3분 27초에 수행.
    @Cron('27 3 1/6 * * *')
    private async removeExpiredLogs() {
        const threshold = Date.now() - expireRange;
        try {
            await this.logModel.deleteMany({ timestamp: { $lte: threshold } });
            await this.exeStatisticModel.deleteMany({ endAt: { $lte: threshold } });
            await this.timeStatisticModel.deleteMany({ timestamp: { $lte: threshold } });
        } catch (e) {
            console.error(e);
        }
    }

    // Log가 1000개 넘어가는지 확인 후, 1000개 넘어갈 시 1001개로 표기.
    public async getRecentLogs(query: RecentLogQueryDTO): Promise<LogResultDTO> {
        const { domain, service, task, exeType, beforeCount = 1, page = 1, limit = 100 } = query;

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);
        if(!conditions) {
            throw new NotFoundException(`Task not found`)
        }

        const exeStats = await this.exeStatisticModel
            .find(conditions)
            .sort({ startAt: -1 })
            .skip(beforeCount)
            .limit(1)
            .select('contextId startAt endAt')
            .lean()
            .exec();

        const targetDoc = exeStats[0];
        if(!targetDoc) {
            throw new NotFoundException(`Task exe statistic not found`)
        }

        // console.log(targetDoc)
        const conditions2 = {}

        conditions2['contextId'] = targetDoc.contextId;
        conditions2['timestamp'] = { $gte: targetDoc.startAt, $lte: targetDoc.endAt };

        const cond2WithOptions = QueryBuilder.filterOptionsConditionBuilder(conditions2, exeType, null, null);
        // console.log(cond2WithOptions)

        const exceed1000 = await this.checkLogCountExceeds1000(cond2WithOptions);
        const promiseArray = [];
        promiseArray.push(
            this.logModel.find(cond2WithOptions)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('taskId contextId exeType level data timestamp')
                .lean()
                .exec())
        if(!exceed1000) {
            promiseArray.push(this.logModel.countDocuments(cond2WithOptions))
        }

        const [ queryData, totalCount ] = await Promise.all(promiseArray);

        if(queryData.length === 0) {
            throw new NotFoundException(`Logs not found`)
        }

        const logs = this.transformDocToLog(queryData);

        // console.log(totalCount);
        // console.log(logs.length);
        // logs.forEach(log => console.log(log));

        return {
            page: Number(page),
            limit: Number(limit),
            totalCount: exceed1000 ? 1001 : totalCount,
            logs: logs
        }
    }

    public async getLogsByTaskId(query: LogQuerybyTaskIdData): Promise<LogResultDTO> {
        const { domain, service, task, from, to, exeType, level, chain, page = 1, limit = 100} = query;

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);
        if(!conditions) {
            throw new NotFoundException(`Task not found`)
        }

        if(from && to){
            conditions['timestamp'] = { $gte: from, $lte: to };
        }
        
        const condWithOptions = QueryBuilder.filterOptionsConditionBuilder(conditions, exeType, level, chain);

        const exceed1000 = await this.checkLogCountExceeds1000(condWithOptions);
        const promiseArray = [];
        promiseArray.push(
            this.logModel.find(condWithOptions)
                .sort({ timestamp: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('taskId contextId exeType level data timestamp')
                .lean()
                .exec())
        if(!exceed1000) {
            promiseArray.push(this.logModel.countDocuments(condWithOptions))
        }


        const [ queryData, totalCount ] = await Promise.all(promiseArray);

        if(queryData.length === 0) {
            throw new NotFoundException(`Logs not found`)
        }

        const logs = this.transformDocToLog(queryData);

        // console.log(totalCount)
        // logs.forEach(log => console.log(log));
        // console.log(logs.length);

        // 결과 및 총 개수 반환
        return {
            page: Number(page), 
            limit: Number(limit),
            totalCount: exceed1000 ? 1001 : totalCount,
            logs: logs
        };
    }

    // testing
    // contextId에서 start end를 뽑아 병렬로 찾는 방식
    public async getLogsByTaskIdAdvanced(query: LogQuerybyTaskIdData): Promise<LogResultDTO> {
        // console.log(query)
        const { domain, service, task, from, to, exeType, level, chain, page = 1, limit = 100} = query;

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);
        if(!conditions) {
            throw new NotFoundException(`Task not found`)
        }

        if(from){
            conditions['startAt'] = { $gte: Number(from) - Number(difference) };
        }
        // console.log(conditions)

        const exeStats = await this.exeStatisticModel
            .find(conditions)
            .sort({ startAt: -1 })
            .select('taskId startAt endAt')
            .lean()
            .exec();

        if(exeStats.length === 0) {
            throw new NotFoundException(`Task exe stats not found`)
        }

        const timestamps = exeStats.map((exeStat) => 
            ({ $gte: exeStat.startAt, $lte: exeStat.endAt }));
        // console.log(timestamps);

        const conditions2 = {};
        const flattenedTaskIds = exeStats.flatMap((exeStat) => exeStat.taskId);
        const uniqueTaskIds = [...new Set(flattenedTaskIds)];
        // console.log(uniqueTaskIds)
        if(uniqueTaskIds){
            conditions2['taskId'] = typeof uniqueTaskIds === 'string' ? uniqueTaskIds : { $in: uniqueTaskIds };
        }
    
        const cond2WithOptions = QueryBuilder.filterOptionsConditionBuilder(conditions2, exeType, level, chain);
        // console.log(cond2WithOptions)

        const conditionsList = timestamps.map((t) => {
            return {
                ...cond2WithOptions,
                timestamp: t,
            }
        })
        // console.log(conditionsList)

        const logsPromises = conditionsList.map((condition) => {
            return this.logModel
                .find(condition)
                .sort({ timestamp: -1 })
                .select('taskId contextId exeType level data timestamp')
                .lean()
                .exec()
        })

        const [ ...queryData ] = await Promise.all([ ...logsPromises]);
        // console.log(queryData);
        const totalCount = queryData.reduce((acc, cur) => acc + cur.length, 0);
        const Alllogs = queryData.flat();

        if(totalCount === 0) {
            throw new NotFoundException(`Logs not found`)
        }

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const logsForPage = Alllogs.slice(startIndex, endIndex);

        const logs = this.transformDocToLog(logsForPage);

        // console.log(totalCount)
        // logs.forEach(log => console.log(log));
        // console.log(logs.length);
        

        // 결과 및 총 개수 반환
        return {
            page: Number(page), 
            limit: Number(limit),
            totalCount: Number(totalCount),
            logs: logs
        };
    }

    public async getLogByContextIds(query: LogQuerybyContextIdData): Promise<LogResultDTO> {
        const { contextId, from, to, exeType, level, chain, page = 1, limit = 100} = query;

        const conditions = {};
        if(contextId){
            conditions['contextId'] = typeof contextId === 'string' ? contextId : { $in: contextId };
        }

        const startAt: number = from - Number(difference);
        if(from && to){
            conditions['startAt'] = { $gte: startAt };
        }

        const exeStats = await this.exeStatisticModel
            .find(conditions)
            .sort({ startAt: -1 })
            .select('taskId startAt endAt')
            .lean()
            .exec();

        // console.log(exeStats);
        if(exeStats.length === 0) {
            throw new NotFoundException(`Task exe stats not found`)
        }

        const conditions2 = {}

        const flattenedTaskIds = exeStats.flatMap((exeStat) => exeStat.taskId);
        const uniqueTaskIds = [...new Set(flattenedTaskIds)];
        // console.log(uniqueTaskIds)
        conditions2['taskId'] = { $in: uniqueTaskIds };
        conditions2['timestamp'] = { $gte: Math.min(
            ...exeStats.map((exeStat) => exeStat.startAt)),
            $lte: Math.max(...exeStats.map((exeStat) => exeStat.endAt),
        )};

        const cond2WithOptions = QueryBuilder.filterOptionsConditionBuilder(conditions2, exeType, level, chain);
    
        const queryData = await this.logModel
            .find(cond2WithOptions)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('taskId contextId exeType level data timestamp')
            .lean()
            .exec()

        if(queryData.length === 0) {
            throw new NotFoundException(`Logs not found`)
        }

        const logs = this.transformDocToLog(queryData);

        return {
            page: Number(page),
            limit: Number(limit),
            totalCount: Number(logs.length),
            logs: logs,
        }
    }

    private transformDocToLog(logs: ILogDoc[]): ResultLog[] {
        return logs.map((log) => {
            const { _id, taskId, ...remain } = log;
            const { domain, service, task } = TaskId.convertFromTaskId(log.taskId);
            return { domain, service, task, ...remain };
        });
    }

    // 조건 자체가 복잡하면 이 케이스가 오래걸릴 수 있긴 함.
    private async checkLogCountExceeds1000(condition: object): Promise<boolean> {
        const result = await this.logModel
            .find(condition)
            .sort({ timestamp: -1 })
            .skip(1000)
            .limit(1)
            .lean()
            .exec()

        return result.length === 1;        
    }
}

