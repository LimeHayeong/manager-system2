import * as mongoose from 'mongoose'

export const databaseProviders = [
    {
        provide: 'DATABASE_CONNECTION',
        useFactory: async (): Promise<typeof mongoose> =>
            mongoose.connect('mongodb://localhost:27017/nest')
    }
]
