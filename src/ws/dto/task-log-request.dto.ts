import { Task } from "src/manager-sys/types/task";

export class TaskLogRequestDTO implements Task.ITaskIdentity{
    domain: string;
    task: string;
    taskType: Task.TaskType;
}

export class NewTaskLogRequestDTO extends TaskLogRequestDTO {
    startLogSeq: number;
}