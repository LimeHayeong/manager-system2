export namespace Task {     
    export enum Domain {
        DomainA = 1,
        DomainB,
        DomainC,
        DomainD
    }

    export enum Service {
        FirstService = 1,
    }

    export enum Task {
        processRT = 1,
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

