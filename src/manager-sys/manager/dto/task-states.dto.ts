import { Task } from "src/manager-sys/types/task";

export class TaskStatesDTO {
    taskStates: Task.TaskState[];
    // TODO: workstates
    workStates: any;
}