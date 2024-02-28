import { Task } from "src/manager-sys/types/task";

export interface TaskHistogramDTO extends Task.ITaskIdentity {
    recentStatistics: Task.StatisticLogBase[];
}

export interface GridRequestDTO {
    blockNumber?: number;
    blockSize?: number;
}

export interface GridResultDTO {
    grids: Task.GRID[]
}

export interface LogQueryDTO {
    domain?: string;
    task?: string;
    taskType?: Task.TaskType;
    contextId?: string[];
    level?: Task.LogLevel;
    chain?: string;
    from: number;
    to: number;
    pageNumber: number;
    pageSize: number;
}

export interface LogQueryResultDTO {
    logscount: number;
    logs: Task.Log[];
}