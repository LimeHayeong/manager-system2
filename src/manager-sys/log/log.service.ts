import { Inject, Injectable } from '@nestjs/common';
import { ILogDoc } from '../database/dto/log.interface';
import { Model } from 'mongoose';
import { IExeStatisticDoc } from '../database/dto/statistic.interface';
import { TaskId } from '../types/taskId';
import { LogQueryDTO, RecentLogResultDTO } from './dto/log-query.dto';
import { Helper } from '../util/helper';

@Injectable()
export class LogService {
    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
        @Inject('EXE_STATISTIC_MODEL')
        private exeStatisticModel: Model<IExeStatisticDoc>,
    ) {
        // this.getRecentLogs('ServiceA', 'processRT', 'CRON', 3);
        // this.getLogs({
        //     domain: ['ServiceA'],
        //     chain: ['Chain_52', 'Chain_35'],
        // })
    }

    // TODO: 이것도 pagination 걸어야 하나?
    @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getRecentLogs(domain: string, service: string, task:string, exeType: string, number: number): Promise<RecentLogResultDTO> {
        const taskId = TaskId.convertToTaskId(domain, service, task);

        const exeLogs = await this.exeStatisticModel
            .find({ taskId: taskId})
            .sort({ startAt: -1 })
            .limit(number)
            .select('contextId startAt endAt')
            .lean()
            .exec();

        const logQueries = exeLogs.map(log =>
            this.logModel
                .find({ contextId: log.contextId, timestamp: { $gte: log.startAt, $lte: log.endAt }})
                .sort({ timestamp: -1 })
                .select('contextId level data timestamp')
                .lean()
                .exec()
        )

        const logsData = await Promise.all(logQueries);

        // 결과 데이터 변환
        // const result = logsData.map((logs) => {
        //     return logs.map(log => {
        //         return { domain, task, taskType, ...log };
        //     });
        // });

        // result.forEach(logs => logs.forEach(log => console.log(log)));
        // result.forEach(logs => console.log(logs[0].timestamp));

        return {
            // logs: result
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
        
        console.log(conditions)

        // 총 문서 개수 조회
        const totalCount = await this.logModel.countDocuments(conditions);

        console.log(totalCount)

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

    private generateTaskIdCombinations(domains: string[], services: string[], tasks: string[]): string[] {
    //     const taskIdCombinations = [];

    
    //     // null이 아닌 요소들만 필터링
    //     const filteredDomains = domains.filter(domain => domain !== null);
    //     const filteredServices = services.filter(service => service !== null);
    //     const filteredTasks = tasks.filter(task => task !== null);
    
    //     // 각 배열이 비어있는지 확인
    //     if (filteredDomains.length === 0 || filteredServices.length === 0 || filteredTasks.length === 0) {
    //         // 하나라도 비어있다면, 빈 배열 반환
    //         return [];
    //     }
        
    //     // 모든 도메인에 대해 반복
    //     filteredDomains.forEach((domain) => {
    //       // 모든 태스크에 대해 반복
    //       filteredServices.forEach((service) => {
    //         // 모든 태스크 타입에 대해 반복
    //         filteredTasks.forEach((task) => {
    //           // 각 조합에 대한 taskId 생성
    //           const taskId = TaskId.convertToTaskId(domain, service, task);
    //           taskIdCombinations.push(taskId);
    //         });
    //       });
    //     });
    
    //     return taskIdCombinations;
            return [];
    }
     
}
