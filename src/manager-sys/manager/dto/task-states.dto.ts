import { Task } from "src/manager-sys/types/task";

export class TaskStatesDTO {
    taskStates: Task.TaskState[];
    // TODO: workstates
    workStates: any;
}

export class DeSerializedTaskState {
    domain: string;
    task: string;
    taskType: string;
    contextId: string;
    status: Task.Status;
    updatedAt: number;
    startAt: number;
    endAt: number;
}