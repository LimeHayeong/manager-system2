export namespace Task {     
    export enum Domain {
        "domain.a" = 1,
        "domain.b",
        "domain.c",
        "domain.d"
    }

    export enum Service {
        "service" = 1,
        "second-service",
    }

    export enum Task {
        "processRT" = 1,
        "processStore",
    }

    export enum ExecutionType {
        CRON = 'CRON',
        TRIGGER = 'TRIGGER',
        WORK = 'WORK'
    }
    
    export enum Status {
        TERMINATED = 'TERMINATED',
        PROGRESS = 'PROGRESS',
        WAITING = 'WAITING',
    }

    export interface TaskState {
        taskId: string;
        exeType: string;
        contextId: string;
        status: Status;
        updatedAt: number;
        startAt: number;
        endAt: number;
    }
}

