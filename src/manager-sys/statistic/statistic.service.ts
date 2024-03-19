import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { IExeStatisticDoc, IMetaDoc, ITimeStatisticDoc } from '../database/dto/statistic.interface';
import { ILogDoc } from '../database/dto/log.interface';
import { Cron } from '@nestjs/schedule';
import { exeStatAggregationPipeline, timeStatAggregationPipeline, viExeAggregationPipeline, viTimeAggregationPipeline } from '../database/queries/mongodb.aggregate';
import { exeStatisticOps, timeStatisticOps } from '../database/queries/mongodb.bulkwrite';
import { ViExeRequestbyTaskIdDTO, ViExeResponsebyTaskIdDTO, ViTimeRequestbyTaskIdDTO, ViTimeResponsebyTaskIdDTO } from './dto/vi.dto';
import { Helper } from '../util/helper';
import { QueryBuilder } from '../database/queries/mongodb.query.builder';

const aggregationBatchSize = 10000;

@Injectable()
export class StatisticService implements OnModuleInit {
    private aggregationBatchSize: number;
    private staticRunning: boolean;

    constructor(
        @Inject('EXE_STATISTIC_MODEL')
        private exeStatisticModel: Model<IExeStatisticDoc>,
        @Inject('TIME_STATISTIC_MODEL')
        private timeStatisticModel: Model<ITimeStatisticDoc>,
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
        @Inject('META_MODEL')
        private metaModel: Model<IMetaDoc>,
    ) {
        this.aggregationBatchSize = aggregationBatchSize
        this.staticRunning = false;

        // this.getExeStatistic();
    }

    async onModuleInit() {
        // await this.getExeStatistic({
        //     domain: 'DomainA',
        //     service: 'SecondService',
        // })
        // await this.getTimeStatistic({
        //     domain: 'DomainA',
        //     service: 'FirstService',
        //     task: 'processRT',
        //     pointNumber: 10,
        //     unitTime: '4h',
        // })
    }

    // 1분마다 통계자료 집계.
    @Cron('0 */1 * * * *')
    @Helper.SimpleErrorHandling
    private async processStatisticAggregation() {
        if(this.staticRunning) return;

        this.staticRunning = true;

        let lastId;
        const metadata = await this.metaModel.find({}).exec();
        if(metadata.length === 0){
            await this.metaModel.create({ lastStatisticId: new mongoose.Types.ObjectId(0) })
            lastId = null;
        }else{
            lastId = metadata[0].lastStatisticId;
        }

        while(true){
            const logs = await this.logModel.find(lastId ? { _id: { $gt: lastId } } : {}).sort({_id: 1}).limit(this.aggregationBatchSize).exec();

            if(logs.length === 0) break;

            const firstId = logs[0]._id;
            lastId = logs[logs.length - 1]._id;

            const timePipe = timeStatAggregationPipeline(firstId, lastId);
            const exePipe = exeStatAggregationPipeline(firstId, lastId);

            // TODO: async하게 진행.
            const timeStats = await this.logModel.aggregate(timePipe);
            const exeStats = await this.logModel.aggregate(exePipe);
            // console.log(timeStats[0], timeStats[timeStats.length - 1])
            // console.log(exeStats[0], exeStats[exeStats.length - 1])

            await Promise.all([
                this.timeStatisticModel.bulkWrite(
                    timeStatisticOps(timeStats)
                ),
                this.exeStatisticModel.bulkWrite(
                    exeStatisticOps(exeStats)
                )
            ])

            await this.metaModel.updateOne({}, { lastStatisticId: lastId });
            // console.log('Aggregation completed! ', lastId);
        }

        console.log('[System] Exe Statistic Aggregation Done with lastId: ', lastId);

        this.staticRunning = false;
    }

    
    // @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getExeStatisticByTaskId(query: ViExeRequestbyTaskIdDTO): Promise<ViExeResponsebyTaskIdDTO> {
        const { domain, service, task, pointNumber = 30, pointSize = 10 } = query;

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);

        const results = [];
        for (let i = 0; i < pointNumber; i++) {
            const aggregateSteps = viExeAggregationPipeline(conditions, Number(pointSize), i)
    
            // 현재 반복에 대한 집계 결과를 가져옵니다.
            const exeStats = await this.exeStatisticModel.aggregate(aggregateSteps);
    
            // 결과가 있을 경우 배열에 추가합니다.
            if (exeStats && exeStats.length > 0) {
                results.push(exeStats[0]); // exeStats는 배열이므로 첫 번째 요소만 추가합니다.
            }
        }

        return {
            domain,
            service,
            task,
            pointNumber: Number(pointNumber),
            pointSize: pointSize,
            data: results
        }
    }

    // @Helper.ExecutionTimerAsync
    @Helper.SimpleErrorHandling
    public async getTimeStatisticByTaskId(query: ViTimeRequestbyTaskIdDTO): Promise<ViTimeResponsebyTaskIdDTO> {
        const { domain, service, task, pointNumber = 30, unitTime = '4h'} = query;

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);

        const results = [];
        for (let i = 0; i < pointNumber; i++) {
            const aggregateSteps = viTimeAggregationPipeline(conditions, unitTime, i)
    
            const timeStats = await this.timeStatisticModel.aggregate(aggregateSteps);
    
            if (timeStats && timeStats.length > 0) {
                results.push(timeStats[0]); // timeStats는 배열이므로 첫 번째 요소만 추가합니다.
            }
        }

        return {
            domain,
            service,
            task,
            pointNumber: Number(pointNumber),
            unitTime: unitTime,
            data: results,
        }
    }
}
