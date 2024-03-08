import { Document } from "mongoose";
import { Task } from "test/test-grid";

export interface ILogDoc extends Document {
    readonly taskId: string;
    readonly contextId: string;
    // TODO: data type 지정
    readonly data: any;
    readonly level: Task.LogLevel;
    readonly timestamp: number;
}