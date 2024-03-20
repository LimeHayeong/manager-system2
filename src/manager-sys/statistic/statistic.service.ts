import { BadRequestException, Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
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
            const [timeStats, exeStats] = await Promise.all([
                this.logModel.aggregate(timePipe),
                this.logModel.aggregate(exePipe)
            ]);
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

    public async getExeStatisticByTaskId(query: ViExeRequestbyTaskIdDTO): Promise<ViExeResponsebyTaskIdDTO> {
        const { domain, service, task, pointNumber = 30 as number, pointSize = 10 as number } = query;

        if(pointNumber > 168 || pointNumber < 0) throw new BadRequestException('Invalid point number')
        if(pointSize > 50 || pointSize < 0) throw new BadRequestException('Invalid point size')

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);
        
        if(!conditions) {
            throw new NotFoundException(`Task not found`)
        }

        const results = [];
        for (let i = 0; i < pointNumber; i++) {
            const aggregateSteps = viExeAggregationPipeline(conditions, Number(pointSize), i)
    
            // 현재 반복에 대한 집계 결과를 가져옵니다.
            let exeStats;
            try {
                exeStats = await this.exeStatisticModel.aggregate(aggregateSteps);
            } catch (e) {}
    
            // 결과가 있을 경우 배열에 추가합니다.
            if (exeStats && exeStats.length > 0) {
                results.push(exeStats[0]); // exeStats는 배열이므로 첫 번째 요소만 추가합니다.
            }
        }

        if(results.length === 0) {
            throw new NotFoundException(`Task exe statistic not found`)
        }

        return {
            domain,
            service,
            task,
            pointNumber: Number(pointNumber),
            pointSize: Number(pointSize),
            pointData: results
        }
    }

    public async getTimeStatisticByTaskId(query: ViTimeRequestbyTaskIdDTO): Promise<ViTimeResponsebyTaskIdDTO> {
        const { domain, service, task, pointNumber = 30 as number, unitTime = '4h'} = query;

        if(pointNumber > 168 || pointNumber < 0) throw new BadRequestException('Invalid point number')
        if(!(['30m', '1h', '4h', '6h', '12h', '24h'].includes(unitTime))) throw new BadRequestException('Invalid unit time')

        const conditions = QueryBuilder.taskIdConditionBuilder(domain, service, task);

        if(!conditions) {
            throw new NotFoundException(`Task not found`)
        }

        const results = [];

        const currentTime = Date.now();
        const size = this.getPointSizefromUnitTime(unitTime)
        const interval = size * 1000 * 60 * 30

        const cleanTime = currentTime - (currentTime % interval)

        for (let i = 0; i < pointNumber; i++) {
            const fromNow = cleanTime - (i * interval)
            const toNow = (i === 0) ? currentTime : cleanTime - ((i-1) * interval)
            
            const aggregateSteps = viTimeAggregationPipeline(conditions, fromNow, toNow - 1)
    
            let timeStats;
            try {
                timeStats = await this.timeStatisticModel.aggregate(aggregateSteps);
            } catch(e){}
    
            const stats = (timeStats && timeStats.length > 0) ? timeStats[0] : null;
            results.push({
                from: fromNow,
                to: toNow,
                info: stats ? stats.info : 0,
                warn: stats ? stats.warn : 0,
                error: stats ? stats.error : 0
            });
        }

        if(results.length === 0) {
            throw new NotFoundException(`Time exe statistic not found`)
        }

        return {
            domain,
            service,
            task,
            pointNumber: Number(pointNumber),
            unitTime: unitTime,
            pointData: results,
        }
    }

    private getPointSizefromUnitTime(timeStr: string): number {
        // 시간을 분으로 변환
        let timeInMinutes: number = 0;
        if (timeStr.includes('h')) {
            timeInMinutes = parseInt(timeStr.replace('h', '')) * 60;
        } else if (timeStr.includes('m')) {
            timeInMinutes = parseInt(timeStr.replace('m', ''));
        }
      
        // 30분 단위로 나눈 몫 계산
        const quotient: number = Math.floor(timeInMinutes / 30);
        return quotient;
      }
}
