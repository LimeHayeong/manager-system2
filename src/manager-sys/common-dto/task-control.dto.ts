import { Task } from "src/manager-sys/types/task";

export class TaskStartRequestDTO {
    domain: string;
    task: string;
    taskType: Task.TaskType;
}

export class TaskActivateRequestDTO {
    domain: string;
    task: string;
    taskType: Task.TaskType;
    active: boolean;
}

export class TaskStatisticRequestDTO {
    domain: string;
    task: string;
    taskType: Task.TaskType;
    number?: number;
    from?: number;
    to?: number;
}