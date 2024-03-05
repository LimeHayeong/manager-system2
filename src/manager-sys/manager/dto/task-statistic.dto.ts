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
    category?: CategoryCount;
}

export interface LogQueryResultDTO {
    query: Query,
    meta: meta,
    logs: Task.Log[]
}

// TODO: DTO 아래애들 적당한 곳으로 옮겨야 함.
export interface pageInfo {
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
    totalLength?: number;
    currentPage?: number;
    pageSize?: number;
    pageInfos?: pageInfo[],
    category?: CategoryCount
}

export type CategoryCount = {
    [category: string]: {
        [value: string]: number | { [subCategory: string]: number };
    };
};

export interface LogEntry {
    timestamp: number;
    [key: string]: any;
}