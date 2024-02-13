import { TaskActivateRequestDTO, TaskStartRequestDTO } from "src/domains/common-dto/task-control.dto";

import { ClsService } from "nestjs-cls";
import { ManagerService } from "../manager/manager.service";
import { NotFoundException } from "@nestjs/common";
import { Task } from "./task";

export abstract class BaseService {
    protected abstract cls: ClsService;
    protected abstract managerService: ManagerService;
  
    protected log(msg: any) {
      const context = this.cls.get('context');
      this.managerService.logTask(context, msg, Task.LogLevel.INFO);
    }

    protected warn(msg: any) {
        const context = this.cls.get('context');
        this.managerService.logTask(context, msg, Task.LogLevel.WARN);
    }

    protected error(msg: any) {
        const context = this.cls.get('context');
        this.managerService.logTask(context, msg, Task.LogLevel.ERROR);
    }

    async triggerTask(data: TaskStartRequestDTO): Promise<string> {
        const { domain, task } = data;
    
        const taskId = { domain, task, taskType: Task.TaskType.TRIGGER}
        this.managerService.isValidTask(taskId)
        await this.managerService.test();
        this.managerService.isRunning(taskId)
        this.managerService.isActivated(taskId)
    
        if(typeof this[task] === 'function') {
            this[task]('TRIGGER');
            return `${domain}:${task} 시작 요청에 성공했습니다.`
        } else {
            throw new NotFoundException(`${domain}:${task}를 찾을 수 없습니다.`)
        }
    }
    
    async activateTask(data: TaskActivateRequestDTO): Promise<string> {
        const { domain, task, taskType, active } = data;
    
        this.managerService.isValidTask({ domain, task, taskType: Task.TaskType.TRIGGER})
        this.managerService.controlTask({domain, task, taskType}, active);
    
        return `${domain}:${task}:${taskType} ${active ? '활성화' : '비활성화'} 요청에 성공했습니다.`
    }
  }