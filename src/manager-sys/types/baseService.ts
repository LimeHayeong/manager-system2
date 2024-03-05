import { TaskActivateRequestDTO, TaskStartRequestDTO, TaskStatisticRequestDTO } from "src/manager-sys/common-dto/task-control.dto";

import { ClsService } from "nestjs-cls";
import { ManagerService } from "../manager/manager.service";
import { NotFoundException } from "@nestjs/common";
import { Task } from "./task";

// TODO: configuration
const defaultErrorStackLength = 4;
const maxErrorStackLength = 7;

export abstract class BaseService {
    protected abstract cls: ClsService;
    protected abstract managerService: ManagerService;
  
    protected async log(data: string, chain?: string) {
        const result: Task.IContext = {
            message: '',
        }
        
        const context = this.cls.get('context');

        if(typeof data === 'string') {
            result.message = data;
        }
        if(chain){
            result.chain = chain;
        }
        
        const workId = this.cls.get('workId');

        await this.managerService.logTask(context, result, Task.LogLevel.INFO, workId);
    }

    protected async warn(data: string, chain?: string) {
        const result: Task.IContext = {
            message: ''
        };

        const context = this.cls.get('context');

        if(typeof data === 'string') {
            result.message = data;
        }
        if(chain){
            result.chain = chain;
        }

        const workId = this.cls.get('workId');
        await this.managerService.logTask(context, result, Task.LogLevel.WARN, workId);
    }

    protected async error(data: string | Error,
        chain?: string,
        errorStack: number = defaultErrorStackLength
    ) {
        const result: Task.IContext = {
            message: '',
            stack: []
        };

        if(errorStack < 0) errorStack = defaultErrorStackLength;
        if(errorStack > maxErrorStackLength) errorStack = maxErrorStackLength;

        const context = this.cls.get('context');

        if(typeof data === 'string') {
            result.message = data;
        } else if (data instanceof Error) {
            result.message = data.message;
            result.stack = this.trimErrorStack(data, errorStack);
        }   
        if(chain){
            result.chain = chain;
        }

        const workId = this.cls.get('workId');
        await this.managerService.logTask(context, result, Task.LogLevel.ERROR, workId);
    }

    // HTTP context
    // manager service에서 exception으로 flow control
    async triggerTask(data: TaskStartRequestDTO): Promise<string> {
        const { domain, task, taskType } = data;
    
        const taskId = { domain, task, taskType }
        this.managerService.isValidTask(taskId)
        // await this.managerService.test();
        this.managerService.isRunning(taskId)
        this.managerService.isActivated(taskId)
    
        if(typeof this[task] === 'function') {
            this[task](taskType);
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