export namespace Task {      
    export enum Status {
        TERMINATED = 'TERMINATED',
        RUNNING = 'RUNNING',
        IDLE = 'IDLE',
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

