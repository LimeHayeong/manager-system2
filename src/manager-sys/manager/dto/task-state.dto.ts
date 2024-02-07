import { Task } from "src/manager-sys/types/task";

export class TaskStateWithSeqLogsDTO implements Task.TaskStatewithLogs {
    domain: string;
    task: string;
    taskType: Task.TaskType;
    contextId: string;
    status: Task.TaskStatus;
    isAvailable: boolean;
    updatedAt: number;
    startAt: number;
    endAt: number;
    lastLogSeq: number;
    recentLogs: Task.Log[][];
}

export class TaskStateWithNewLogsDTO implements Task.TaskState {
    domain: string;
    task: string;
    taskType: Task.TaskType;
    contextId: string;
    status: Task.TaskStatus;
    isAvailable: boolean;
    updatedAt: number;
    startAt: number;
    endAt: number;
    lastLogSeq: number;
    reqLogs: Task.Log[];
}