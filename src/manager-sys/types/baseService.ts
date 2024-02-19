import { TaskActivateRequestDTO, TaskStartRequestDTO, TaskStatisticRequestDTO } from "src/manager-sys/common-dto/task-control.dto";

import { ClsService } from "nestjs-cls";
import { ManagerService } from "../manager/manager.service";
import { NotFoundException } from "@nestjs/common";
import { Task } from "./task";

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
        if(workId){
            await this.managerService.logTask(context, result, Task.LogLevel.INFO, workId);
        }else{
            await this.managerService.logTask(context, result, Task.LogLevel.INFO);
        }
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
        if(workId){
            await this.managerService.logTask(context, result, Task.LogLevel.WARN, workId);
        }else{
            await this.managerService.logTask(context, result, Task.LogLevel.WARN);
        }
    }

    protected async error(data: string | Error,
        chain?: string,
        options?: {
            errorStack?: number
    }) {
        const result: Task.IContext = {
            message: '',
            stack: []
        };

        

        const defaultOptions = { errorStack: 4 };
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
        if(chain){
            result.chain = chain;
        }

        const workId = this.cls.get('workId');
        if(workId){
            await this.managerService.logTask(context, result, Task.LogLevel.ERROR, workId);
        }else{
            await this.managerService.logTask(context, result, Task.LogLevel.ERROR);
        }
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

    async getStatistic(
        data: TaskStatisticRequestDTO
    ): Promise<Task.StatisticLog[]> {
        return await this.managerService.getTaskStatistic(data);
    }

    private trimErrorStack(error: Error, numberOfLines: number): string[] {
        const stackLines = error.stack?.split('\n') || [];
        return stackLines.slice(0, numberOfLines)
    }
  }