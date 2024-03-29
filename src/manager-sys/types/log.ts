import { Task } from "./task";

export namespace Log {
    export enum Level {
        INFO = 'INFO',
        WARN = 'WARN',
        ERROR = 'ERROR',
    }

    export interface Log {
        taskId: string;
        contextId: string;
        level: Level;
        exeType: Task.ExecutionType
        data: LogData | null;
        timestamp: number; // toISOString
    }

    export interface LogData {
      message?: string;
      chain?: string;
      stack?: string[];
    }

    export interface LogCache {
        [key: string]: Log[];
    }
}