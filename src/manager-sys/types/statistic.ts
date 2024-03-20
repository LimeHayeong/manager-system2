import mongoose from "mongoose";

export namespace Stat {
    export interface ExeStatistic {
        taskId: string[];
        contextId: string;
        data: taskStatistic;
        startAt: number;
        endAt: number;
    }

    export interface TimeStatistic {
        taskId: string;
        timestamp: number;
        data: taskStatistic;
    }

    export interface taskStatistic {
        info?: number;
        warn?: number;
        error?: number;
    }

    export interface Meta {
        lastStatisticId: mongoose.Schema.Types.ObjectId;
    }
}