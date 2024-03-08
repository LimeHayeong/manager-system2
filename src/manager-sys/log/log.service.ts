import { Inject, Injectable } from '@nestjs/common';
import { ILogDoc } from '../database/interface/log.interface';
import { Model } from 'mongoose';

@Injectable()
export class LogService {
    constructor(
        @Inject('LOG_MODEL')
        private logModel: Model<ILogDoc>,
    ) {}
}
