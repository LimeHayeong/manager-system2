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

export interface LogQueryDTO extends Query {
    initial?: boolean;
    pageNumber?: number;
    pageDate?: string;
    pageStartLine?: number;
}

export interface LogQueryResultDTO {
    query: Query,
    meta: meta,
    logs: Task.Log[]
}

interface pageInfo {
    pageNumber: number,
    date: string,
    startLine: number
}

export interface Query {
    domain?: string;
    task?: string;
    taskType?: string;
    contextId?: string[],
    level?: Task.LogLevel,
    chain?: string,
    from?: number,
    to?: number,
}

interface meta {
    initial?: boolean;
    totalLogs?: number;
    currentPage?: number;
    pageSize?: number;
    pageInfos?: pageInfo[],
}