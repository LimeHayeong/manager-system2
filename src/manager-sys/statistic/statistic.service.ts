import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { IStatisticDoc } from '../database/interface/statistic.interface';

@Injectable()
export class StatisticService {
    constructor(
        @Inject('STATISTIC_MODEL')
        private statisticModel: Model<IStatisticDoc>,
    ) {

    }
}
