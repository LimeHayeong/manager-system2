import { StatisticSchema } from "../database/schemas/statistic.schema";
import mongoose from "mongoose";

export const statisticProviders = [
    {
        provide: 'STATISTIC_MODEL',
        useFactory: (connection: mongoose.Connection) => connection.model('Statistic', StatisticSchema),
        inject: ['DATABASE_CONNECTION'],
      },
]