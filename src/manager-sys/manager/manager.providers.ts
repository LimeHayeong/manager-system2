import { LogSchema } from "../database/schemas/log.schema";
import mongoose from "mongoose";

export const managersProviders = [
    {
        provide: 'LOG_MODEL',
        useFactory: (connection: mongoose.Connection) => connection.model('Log', LogSchema),
        inject: ['DATABASE_CONNECTION'],
      },
]