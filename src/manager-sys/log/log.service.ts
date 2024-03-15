import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ILogDoc } from '../database/dto/log.interface';
import { Model } from 'mongoose';
import { IExeStatisticDoc } from '../database/dto/statistic.interface';
import { TaskId } from '../types/taskId';
import { LogQueryDTO, RecentLogQueryDTO, RecentLogResultDTO } from './dto/log-query.dto';
import { Helper } from '../util/helper';

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
        await this.getRecentLogs({
            domain: 'DomainA',
            service: 'SecondService',
            exeType: 'CRON',
        });
        // await this.getLogs({
        //     domain: 'DomainA',
        //     chain: ['Chain_52', 'Chain_35'],
        // })
    }

    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getRecentLogs(query: RecentLogQueryDTO): Promise<RecentLogResultDTO> {
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

        const exeLogs = await this.exeStatisticModel
            .find(conditions)
            .sort({ startAt: -1 })
            .skip(beforeCount)
            .limit(1)
            .select('contextId startAt endAt')
            .lean()
            .exec();

        const targetDoc = exeLogs[0];

        // console.log(targetDoc)
        const conditions2 = {}
        if('exeType'){
            conditions2['exeType'] = exeType;
        }
        conditions2['contextId'] = targetDoc.contextId;
        conditions2['timestamp'] = { $gte: targetDoc.startAt, $lte: targetDoc.endAt };

        const queryData = await this.logModel
            .find(conditions2)
            .sort({ timestamp: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .select('taskId contextId exeType level data timestamp')
            .lean()
            .exec()

        const logs = queryData.map((log) => {
            const { domain, service, task } = TaskId.convertFromTaskId(log.taskId);
            return { domain, service, task, ...log };
        })

        // console.log(logs.length);

        // logs.forEach(log => console.log(log));
        // console.log(logs[0].timestamp)

        return {
            page: page,
            limit: limit,
            logs: []
        }
    }

    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getLogs(query: LogQueryDTO): Promise<any> {
        const { domain, service, task, contextId, from, to, level, chain, page = 1, limit = 100} = query;

        // const taskId = TaskId.convertToTaskId(domain, task, taskType);
        // const regex = TaskId.createRegexFromTaskId(taskId);
        const taskIds = this.generateTaskIdCombinations(domain, service, task);


        // 기본 쿼리 빌더 구성
        const conditions = {};

        if(taskIds) {
            conditions['taskId'] = { $in: taskIds };
        }

        // if(regex){
        //     conditions['taskId'] = { $regex: regex };
        // }

        // if (contextId) {
        //     const exe = await this.exeStatisticModel
        //         .find({ contextId: contextId })
        //         .select('contextId startAt endAt')
        //         .limit(1)
        //         .lean()
        //         .exec();

        //     conditions['contextId'] = contextId;
        //     conditions['timestamp'] = { $gte: exe[0].startAt, $lte: exe[0].endAt };
        // }

        if (query.from && query.to) {
            conditions['timestamp'] = { $gte: query.from, $lte: query.to };
        } else if (query.from) {
            conditions['timestamp'] = { $gte: query.from };
        } else if (query.to) {
            conditions['timestamp'] = { $lte: query.to };
        }
    
        if (query.level && query.level.length) {
            conditions['level'] = { $in: query.level };
        }
    
        if (query.chain && query.chain.length) {
            conditions['data.chain'] = { $in: query.chain };
        }
        
        // console.log(conditions)

        // 총 문서 개수 조회
        const totalCount = await this.logModel.countDocuments(conditions);

        // console.log(totalCount)

        // 문서 조회 및 페이징 처리
        const logs = await this.logModel
            .find(conditions)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .exec();

        // 결과 및 총 개수 반환
        return {
            totalCount,
            logs
        };
    }

    private generateTaskIdCombinations(domain: string, service: string, tasks: string[]): string[] {
        const taskIdCombinations = [];

        if(tasks != null){
            tasks.forEach((task) => {
                const taskId = TaskId.convertToTaskId(domain, service, task);
                taskIdCombinations.push(taskId);
            })
        }
    
        return taskIdCombinations;
    }
     
}
