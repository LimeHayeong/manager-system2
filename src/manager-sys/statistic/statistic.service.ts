import { Inject, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { IExeStatisticDoc, IMetaDoc, ITimeStatisticDoc } from '../database/dto/statistic.interface';
import { ILogDoc } from '../database/dto/log.interface';
import { Cron } from '@nestjs/schedule';
import { exeStatAggregationPipeline, timeStatAggregationPipeline } from '../database/queries/mongodb.aggregate';
import { exeStatisticOps, timeStatisticOps } from '../database/queries/mongodb.bulkwrite';
import { TaskId } from '../types/taskId';
import { ViExeRequestDTO, ViExeResultDTO } from './dto/vi.dto';

const aggregationBatchSize = 10000;

@Injectable()
export class StatisticService {
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

    // 1분마다 통계자료 집계.
    @Cron('0 */1 * * * *')
    private async processStatisticAggregation() {
        if(this.staticRunning) return;

        this.staticRunning = true;
        try {
            let lastId;
            const metadata = await this.metaModel.find({}).exec();
            if(metadata.length === 0){
                await this.metaModel.create({ lastStatisticId: new mongoose.Types.ObjectId(0) })
                lastId = null;
            }else{
                lastId = metadata[0].lastStatisticId;
            }

            while(true){
                const logs = await this.logModel.find(lastId ? { _id: { $gt: lastId } } : {}).sort({_id: 1}).limit(aggregationBatchSize).exec();

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
        } catch (e) {
            console.error(e);
        }

        this.staticRunning = false;
    }

    // public async getExeStatistic(domain: string, task: string, taskType: string, pointNumber: number, pointSize: number): Promise<ViExeResultDTO> {
    //     const taskId = TaskId.convertToTaskId(domain, task, taskType);
    //     try {
    //         const data = await this.exeStatisticModel
    //             .find({ taskId: taskId })
    //             .sort({ startAt: -1 })
    //             .limit(pointNumber * pointSize)
    //             .select('contextId data startAt')
    //             .lean()
    //             .exec();

    //         const result = data.map((d) => {
    //             return {
                    
    //             }
    //         })

    //         return {}
    //     } catch (e) {
    //         console.error(e);

    //     }
    // }
}
