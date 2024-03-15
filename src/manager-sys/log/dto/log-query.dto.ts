import { Log } from "src/manager-sys/types/log";

export interface RecentLogQueryDTO {
    domain: string;
    service?: string;
    task?: string;
    exeType?: string;
    number?: number;
}

export interface RecentLogResultDTO {
    logs: ResultLog[][];
}

export interface ResultLog extends Omit<Log.Log, 'taskId'> {
    domain: string;
    service: string;
    task: string;
}

export interface LogQueryDTO {
    domain?: string[];
    service?: string[]
    task?: string[];
    exeType?: string[];
    contextId?: string[];
    from?: number;
    to?: number;
    level?: Log.Level[];
    chain?: string[];
    page?: number;
    limit?: number;
}