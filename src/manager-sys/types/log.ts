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
        data: IContext | null;
        timestamp: number; // toISOString
    }

    export interface IContext {
      message?: string;
      chain?: string;
      stack?: string[];
    }

    export interface LogCache {
        [taskId: string]: Log[];
    }
}