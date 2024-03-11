import { DeSerializedTaskState } from "src/manager-sys/manager/dto/task-states.dto";

export class TaskStatesResponseDTO {
    taskStates: DeSerializedTaskState[];
    // TODO: workstates
    workStates: any;
}