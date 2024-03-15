import { Log } from "src/manager-sys/types/log";

export interface RecentLogQueryDTO {
    domain: string;
    service?: string;
    task?: string[];
    exeType?: string;
    beforeCount?: number;
    page?: number;
    limit?: number;
}

export interface RecentLogResultDTO {
    page: number;
    limit: number;
    logs: ResultLog[][];
}

export interface ResultLog extends Omit<Log.Log, 'taskId'> {
    domain: string;
    service: string;
    task: string;
}

export interface LogQueryDTO {
    domain: string;
    service?: string;
    task?: string[];
    exeType?: string[];
    contextId?: string[];
    level?: Log.Level[];
    chain?: string[];
    from?: number;
    to?: number;
    page?: number;
    limit?: number;
}