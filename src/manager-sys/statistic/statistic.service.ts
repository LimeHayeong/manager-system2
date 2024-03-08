import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IExeStatisticDoc, ITimeStatisticDoc } from '../database/interface/statistic.interface';

@Injectable()
export class StatisticService {
    constructor(
        @Inject('EXE_STATISTIC_MODEL')
        private exeStatisticModel: Model<IExeStatisticDoc>,
        @Inject('TIME_STATISTIC_MODEL')
        private timeStatisticModel: Model<ITimeStatisticDoc>,
    ) {

    }
}
