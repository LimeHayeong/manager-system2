import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ILogDoc } from '../database/dto/log.interface';
import { Model } from 'mongoose';
import { IExeStatisticDoc } from '../database/dto/statistic.interface';
import { TaskId } from '../types/taskId';
import { FilteringOptions, LogQuerybyContextIdData, LogQuerybyTaskIdData, LogResultDTO, RecentLogQueryDTO } from './dto/log-query.dto';
import { Helper } from '../util/helper';
import { timestamp } from 'rxjs';

const difference: number = 1000 * 60 * 60 * 1;

@Injectable()
export class LogService implements OnModuleInit {
    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
        @Inject('EXE_STATISTIC_MODEL')
        private exeStatisticModel: Model<IExeStatisticDoc>,
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

    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getRecentLogs(query: RecentLogQueryDTO): Promise<LogResultDTO> {
        const { domain, service, task, exeType, beforeCount = 1, page = 1, limit = 100 } = query;

        const conditions = {};
        if(domain && service && task){
            const taskIds = this.generateTaskIdCombinations(domain, service, task);
            conditions['taskId'] = { $in: taskIds };
        } else if( domain && service){
            const taskId = TaskId.convertToTaskId(domain, service, null);
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = { $regex: regex };
        } else if(domain) {
            const taskId = TaskId.convertToTaskId(domain, null, null);
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = { $regex: regex };
        }

        // console.log(conditions);

        const exeStats = await this.exeStatisticModel
            .find(conditions)
            .sort({ startAt: -1 })
            .skip(beforeCount)
            .limit(1)
            .select('contextId startAt endAt')
            .lean()
            .exec();

        const targetDoc = exeStats[0];

        // console.log(targetDoc)
        const conditions2 = {}
        if(exeType){
            conditions2['exeType'] = typeof exeType === 'string' ? exeType : { $in: exeType };
        }
        conditions2['contextId'] = targetDoc.contextId;
        conditions2['timestamp'] = { $gte: targetDoc.startAt, $lte: targetDoc.endAt };

        console.log(conditions2)

        const totalCount = await this.logModel.countDocuments(conditions2);

        const queryData = await this.logModel
            .find(conditions2)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('taskId contextId exeType level data timestamp')
            .lean()
            .exec()

        const logs = queryData.map((log) => {
            const { _id, ...remain } = log;
            const { domain, service, task } = TaskId.convertFromTaskId(log.taskId);
            return { domain, service, task, ...remain };
        })

        // console.log(totalCount);
        // console.log(logs.length);
        // logs.forEach(log => console.log(log));

        return {
            page: page as number,
            limit: limit as number,
            totalCount: totalCount as number,
            logs: logs
        }
    }

    // TODO: 이렇게 하는 게 맞긴한데, startAt이 지정이 안되어 있으니까 전체를 parsing하느라 성능이 떨어짐.
    // 먼저 contextId에서 startAt, endAt 리스트를 뽑아오는게 낫지 않을까? from, to 오차에 주의하긴 해야함.
    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getLogsByTaskId(query: LogQuerybyTaskIdData): Promise<LogResultDTO> {
        // console.log(query)
        const { domain, service, task, from, to, exeType, level, chain, page = 1, limit = 100} = query;

        const conditions = {};

        if(domain && service && task){
            const taskIds = this.generateTaskIdCombinations(domain, service, task);
            conditions['taskId'] = { $in: taskIds };
        } else if( domain && service){
            const taskId = TaskId.convertToTaskId(domain, service, null);
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = { $regex: regex };
        } else if(domain) {
            const taskId = TaskId.convertToTaskId(domain, null, null);
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = { $regex: regex };
        }
        if(from && to){
            conditions['timestamp'] = { $gte: from, $lte: to };
        }
        if (exeType) {
            conditions['exeType'] = typeof exeType === 'string' ? exeType : { $in: exeType };
        }

        if( level ) {
            conditions['level'] = typeof level === 'string' ? level : { $in: level };
        }

        if( chain ) {
            conditions['data.chain'] = typeof chain === 'string' ? chain : { $in: chain };
        }

        // console.log(conditions)

        const totalCountPromise = this.logModel.countDocuments(conditions);
        const logsPromise = this.logModel
            .find(conditions)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('taskId contextId exeType level data timestamp')
            .lean()
            .exec();

        const [ totalCount, queryData ] = await Promise.all([totalCountPromise, logsPromise]);

        const logs = queryData.map((log) => {
            const { _id, ...remain } = log;
            const { domain, service, task } = TaskId.convertFromTaskId(log.taskId);
            return { domain, service, task, ...remain };
        })

        // console.log(totalCount)
        // logs.forEach(log => console.log(log));
        // console.log(logs.length);
        

        // 결과 및 총 개수 반환
        return {
            page: page as number, 
            limit: limit as number,
            totalCount: totalCount as number,
            logs: logs
        };
    }

    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getLogsByTaskIdAdvanced(query: LogQuerybyTaskIdData): Promise<LogResultDTO> {
        console.log(query)
        const { domain, service, task, from, to, exeType, level, chain, page = 1, limit = 100} = query;

        const conditions = {};

        if(domain && service && task){
            const taskIds = this.generateTaskIdCombinations(domain, service, task);
            conditions['taskId'] = { $in: taskIds };
        } else if( domain && service){
            const taskId = TaskId.convertToTaskId(domain, service, null);
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = { $regex: regex };
        } else if(domain) {
            const taskId = TaskId.convertToTaskId(domain, null, null);
            const regex = TaskId.createRegexFromTaskId(taskId);
            conditions['taskId'] = { $regex: regex };
        }
        if(from){
            conditions['startAt'] = { $gte: Number(from) - Number(difference) };
        }

        console.log(conditions)

        const exeStats = await this.exeStatisticModel
            .find(conditions)
            .sort({ startAt: -1 })
            .select('taskId startAt endAt')
            .lean()
            .exec();

        const conditions3 = [];
        const timestamps = exeStats.map((exeStat) => 
            ({ $gte: exeStat.startAt, $lte: exeStat.endAt }));
        console.log(timestamps);

        

        const conditions2 = {};
        const flattenedTaskIds = exeStats.flatMap((exeStat) => exeStat.taskId);
        const uniqueTaskIds = [...new Set(flattenedTaskIds)];
        // console.log(uniqueTaskIds)
        if(uniqueTaskIds){
            conditions2['taskId'] = typeof uniqueTaskIds === 'string' ? uniqueTaskIds : { $in: uniqueTaskIds };
        }
    

        if (exeType) {
            conditions2['exeType'] = typeof exeType === 'string' ? exeType : { $in: exeType };
        }
        if (level) {
            conditions2['level'] = typeof level === 'string' ? level : { $in: level };
        }
        if (chain) {
            conditions2['data.chain'] = typeof chain === 'string' ? chain : { $in: chain };
        }
        console.log(conditions2)

        const conditionsList = timestamps.map((t) => {
            return {
                ...conditions2,
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

        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const logsForPage = Alllogs.slice(startIndex, endIndex);


        const logs = logsForPage.map((log) => {
            const { _id, ...remain } = log;
            const { domain, service, task } = TaskId.convertFromTaskId(log.taskId);
            return { domain, service, task, ...remain };
        })

        // console.log(totalCount)
        // logs.forEach(log => console.log(log));
        // console.log(logs.length);
        

        // 결과 및 총 개수 반환
        return {
            page: page as number, 
            limit: limit as number,
            totalCount: totalCount as number,
            logs: logs
        };
    }

    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
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

        console.log(exeStats);

        const conditions2 = {}

        const flattenedTaskIds = exeStats.flatMap((exeStat) => exeStat.taskId);
        const uniqueTaskIds = [...new Set(flattenedTaskIds)];
        // console.log(uniqueTaskIds)
        conditions2['taskId'] = { $in: uniqueTaskIds };
        conditions2['timestamp'] = { $gte: Math.min(
            ...exeStats.map((exeStat) => exeStat.startAt)),
            $lte: Math.max(...exeStats.map((exeStat) => exeStat.endAt),
        )};
        if (exeType) {
            conditions['exeType'] = typeof exeType === 'string' ? exeType : { $in: exeType };
        }
        if (level) {
            conditions['level'] = typeof level === 'string' ? level : { $in: level };
        }
        if (chain) {
            conditions['data.chain'] = typeof chain === 'string' ? chain : { $in: chain };
        }
    
        const queryData = await this.logModel
            .find(conditions2)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('taskId contextId exeType level data timestamp')
            .lean()
            .exec()

        const logs = queryData.map((log) => {
            const { _id, ...remain } = log;
            const { domain, service, task } = TaskId.convertFromTaskId(log.taskId);
            return { domain, service, task, ...remain };
        })

        return {
            page: page as number,
            limit: limit as number ,
            totalCount: logs.length as number ,
            logs: logs,
        }
    }



    private generateTaskIdCombinations(domain: string, service: string, tasks: string[]): string[] {
        const taskIdCombinations = [];

        if(tasks.length > 1){
            tasks.forEach((task) => {
                const taskId = TaskId.convertToTaskId(domain, service, task);
                taskIdCombinations.push(taskId);
            })
        }
    
        return taskIdCombinations;
    }
}

