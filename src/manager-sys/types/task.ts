export namespace Task {      
    export enum Status {
        TERMINATED = 'TERMINATED',
        PROGRESS = 'PROGRESS',
        WAITING = 'WAITING',
    }

    export interface TaskState {
        taskId: string;
        contextId: string;
        status: Status;
        updatedAt: number;
        startAt: number;
        endAt: number;
    }
}

