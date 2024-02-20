import { Task } from "src/manager-sys/types/task";

export class TaskStatesNoLogsDTO {
    taskStates: Task.TaskState[];
    workStates: workStatesDTO[];
}

class workStatesDTO implements Task.IWorkIdentity {
    work: string;
    workType: Task.TaskType;
    contextId: string;
    status: Task.TaskStatus;
    updatedAt: number;
    startAt: number;
    endAt: number;
    taskList: Task.TaskState[];
}