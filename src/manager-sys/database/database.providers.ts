import * as mongoose from 'mongoose'

import { ExeStatisticSchema, MetaSchema, TimeStatisticSchema } from './schemas/statistic.schema'

import { LogSchema } from './schemas/log.schema'

export const databaseProviders = [
    {
        provide: 'DATABASE_CONNECTION',
        useFactory: async (): Promise<typeof mongoose> =>
            mongoose.connect('mongodb://localhost:27017/nest')
    }
]

export const modelsProviders = {
    logModel: {
        provide: 'LOG_MODEL',
        useFactory: (connection: mongoose.Connection) => connection.model('Log', LogSchema),
        inject: ['DATABASE_CONNECTION'],
    },
    exeStatisticModel: {
        provide: 'EXE_STATISTIC_MODEL',
        useFactory: (connection: mongoose.Connection) => connection.model('ExeStatistic', ExeStatisticSchema),
        inject: ['DATABASE_CONNECTION'],
    },
    timeStatisticModel: {
        provide: 'TIME_STATISTIC_MODEL',
        useFactory: (connection: mongoose.Connection) => connection.model('TimeStatistic', TimeStatisticSchema),
        inject: ['DATABASE_CONNECTION'],
    },
    metaModel: {
        provide: 'META_MODEL',
        useFactory: (connection: mongoose.Connection) => connection.model('Meta', MetaSchema),
        inject: ['DATABASE_CONNECTION'],
    }
}