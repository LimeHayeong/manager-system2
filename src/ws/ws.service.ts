import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { ManagerService } from 'src/manager-sys/manager/manager.service';
import { TaskStatesNoLogsDTO } from 'src/manager-sys/manager/dto/task-states.dto';
import { NewTaskLogRequestDTO, TaskLogRequestDTO } from './dto/task-log-request.dto';
import { TaskStateWithNewLogsDTO, TaskStateWithSeqLogsDTO } from 'src/manager-sys/manager/dto/task-state.dto';

@Injectable()
export class WsService {
    constructor(
        @Inject(forwardRef(() => ManagerService))
        private readonly managerService: ManagerService
    ) {}

    public async getInitialStates(): Promise<TaskStatesNoLogsDTO> {
        return await this.managerService.wsGetCurrentStates();
    }

    public async getTaskLogs(data: TaskLogRequestDTO): Promise<TaskStateWithSeqLogsDTO> {
        return await this.managerService.wsGetTaskLogs(data);
    }

    public async getNewTaskLogs(data: NewTaskLogRequestDTO): Promise<TaskStateWithNewLogsDTO> {
        return await this.managerService.wsGetNewTaskLogs(data.domain, data.task, data.taskType, data.startLogSeq);
    }
}
