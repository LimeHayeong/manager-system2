import { TaskId } from "../types/taskId";

export class TaskStartRequestDTO {
    domain: string;
    task: string;
    taskType: string;
}