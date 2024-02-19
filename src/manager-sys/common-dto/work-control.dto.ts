import { Task } from "../types/task";

export class WorkStartRequestDTO {
    work: string;
    workType: Task.TaskType;
}