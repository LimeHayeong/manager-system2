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

// TODO: 수정해야함.
export interface LogResponseDTO extends LogResultDTO{
    filteringOptions: any;
}

export interface LogResultDTO {
    page: number;
    limit: number;
    totalCount: number;
    logs: ResultLog[]
}

export interface ResultLog extends Omit<Log.Log, 'taskId'> {
    domain: string;
    service: string;
    task: string;
}

// TODO: 하드코딩 고치기
export const FilteringOptions = {
    exeTypes: [ 'CRON', 'TRIGGER', 'WORK'],
    levels: [ 'INFO', 'WARN', 'ERROR'],
    chains: [],
}

export interface LogQuerybyTaskIdDTO extends QueryOptions {
    domain: string;
    service?: string;
    task?: string[];
}

export interface LogQuerybyContextIdDTO extends QueryOptions{
    contextId: string[];
}

export interface LogQuerybyTaskIdData extends Omit<LogQuerybyTaskIdDTO, 'queryType'> {
}

export interface LogQuerybyContextIdData extends Omit<LogQuerybyContextIdDTO, 'queryType'> {
}

export interface QueryOptions {
    from: number;
    to: number;
    queryType: 'taskId' | 'contextId';
    exeType?: string[];
    level?: Log.Level[];
    chain?: string[];
    page?: number;
    limit?: number;
}