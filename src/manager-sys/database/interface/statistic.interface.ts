import { Document } from "mongoose";

export interface IStatisticDoc extends Document {
    readonly taskId: string;
    readonly contextId: string;
    // TODO: data type 지정
    readonly data: any;
    readonly startAt: number;
    readonly endAt: number;
}