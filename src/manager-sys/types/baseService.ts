import { TaskActivateRequestDTO, TaskStartRequestDTO } from "src/domains/common-dto/task-control.dto";

import { ClsService } from "nestjs-cls";
import { ManagerService } from "../manager/manager.service";
import { NotFoundException } from "@nestjs/common";
import { Task } from "./task";

export abstract class BaseService {
    protected abstract cls: ClsService;
    protected abstract managerService: ManagerService;
  
    protected log(data: string) {
        const result: Task.IContext = {
            message: data,
        }
      const context = this.cls.get('context');
      this.managerService.logTask(context, result, Task.LogLevel.INFO);
    }

    protected warn(data: string,
        options?: {
            functionContext?: boolean
        }) {
        const result: Task.IContext = {
            message: '',
            functionContext: {}
        };

        const defaultOptions = { functionContext: true };
        const effectiveOptions = { ...defaultOptions, ...options };

        const context = this.cls.get('context');

        if(typeof data === 'string') {
            result.message = data;
        }

        if(effectiveOptions.functionContext) {
            result.functionContext = this.cls.get('functionContext');
        }

        this.managerService.logTask(context, result, Task.LogLevel.WARN);
    }

    protected error(data: string | Error,
        options?: {
            functionContext?: boolean,
            errorStack?: number
    }): void {
        const result: Task.IContext = {
            message: '',
            functionContext: {},
            stack: []
        };

        const defaultOptions = { functionContext: true, errorStack: 2 };
        const effectiveOptions = { ...defaultOptions, ...options };
        if(effectiveOptions.errorStack < 0) effectiveOptions.errorStack = 0;
        if(effectiveOptions.errorStack > 7) effectiveOptions.errorStack = 7;

        const context = this.cls.get('context');

        if(typeof data === 'string') {
            result.message = data;
        } else if (data instanceof Error) {
            result.message = data.message;
            result.stack = this.trimErrorStack(data, effectiveOptions.errorStack);
        }

        if(effectiveOptions.functionContext) {
            result.functionContext = this.cls.get('functionContext');
        }      

        this.managerService.logTask(context, result, Task.LogLevel.ERROR);
    }

    // HTTP context
    // manager service에서 exception으로 flow control
    async triggerTask(data: TaskStartRequestDTO): Promise<string> {
        const { domain, task } = data;
    
        const taskId = { domain, task, taskType: Task.TaskType.TRIGGER}
        this.managerService.isValidTask(taskId)
        // await this.managerService.test();
        this.managerService.isRunning(taskId)
        this.managerService.isActivated(taskId)
    
        if(typeof this[task] === 'function') {
            this[task]('TRIGGER');
            return `${domain}:${task} 시작 요청에 성공했습니다.`
        } else {
            throw new NotFoundException(`${domain}:${task}를 찾을 수 없습니다.`)
        }
    }
    
    // HTTP context
    // manager service에서 exception으로 flow control
    async activateTask(data: TaskActivateRequestDTO): Promise<string> {
        const { domain, task, taskType, active } = data;
    
        this.managerService.isValidTask({ domain, task, taskType: Task.TaskType.TRIGGER})
        this.managerService.controlTask({domain, task, taskType}, active);
    
        return `${domain}:${task}:${taskType} ${active ? '활성화' : '비활성화'} 요청에 성공했습니다.`
    }

    private trimErrorStack(error: Error, numberOfLines: number): string[] {
        const stackLines = error.stack?.split('\n') || [];
        return stackLines.slice(0, numberOfLines)
    }
  }