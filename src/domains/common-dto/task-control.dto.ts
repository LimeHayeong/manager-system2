import { Task } from "src/manager-sys/types/task";

export class TaskStartRequestDTO {
    domain: string;
    // functionName.
    task: string;
}

export class TaskActivateRequestDTO {
    domain: string;
    task: string;
    taskType: Task.TaskType;
    active: boolean;
}