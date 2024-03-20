import { Log } from "src/manager-sys/types/log";

export class recentLogsRequestDTO {
    domain: string;
    service: string;
    task: string;
    exeType?: string;
    offset: number;
    limit: number;
}

export class recentLogsResponseDTO {
    offset: number;
    limit: number;
    logs: Log.Log[];
}