import { Task } from "src/manager-sys/types/task";

export interface TaskHistogramDTO extends Task.ITaskIdentity {
    recentStatistics: Task.StatisticLogBase[];
}

export interface GridRequestDTO {
    blockNumber?: number;
    blockSize?: number;
}

export interface GridResultDTO {
    time: Task.StarttoEnd[]
    grids: Task.GRID[]
}

export interface LogQueryDTO {
    domain?: string;
    task?: string;
    taskType?: Task.TaskType;
    contextId?: Task.LogContextId;
    level?: Task.LogLevel;
    chain?: string;
    from?: number;
    to?: number;
}