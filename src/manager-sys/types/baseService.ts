import { ConflictException, InternalServerErrorException, NotFoundException } from "@nestjs/common";

import { ClsService } from "nestjs-cls";
import { Log } from "./log";
import { ManagerService } from "../manager/manager.service";
import { TaskId } from "./taskId";
import { TaskStartRequestDTO } from "../common-dto/task-control.dto";
import { trimErrorStack } from "../util/error";

const ErrorStackLength = 4;
const maxErrorStackLength = 7;

export abstract class BaseService {
    protected abstract cls: ClsService;
    protected abstract manager: ManagerService;

    protected async log(data: string, chain?: string){
        const result: Log.IContext = {
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

        await this.manager.logTask(context, Log.Level.INFO, result, workId);
    }

    protected async warn(data: string, chain?: string){
        const result: Log.IContext = {
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
        await this.manager.logTask(context, Log.Level.WARN, result, workId);
    }

    protected async error(data: string | Error,
        chain?: string,
        errorStack?: number){
        const result: Log.IContext = {
            message: '',
            stack: []
        };

        if(errorStack === undefined) errorStack = ErrorStackLength;
        else if(errorStack > maxErrorStackLength) errorStack = maxErrorStackLength;
        else if(errorStack < 0) errorStack = ErrorStackLength;

        const context = this.cls.get('context');

        if(typeof data === 'string') {
            result.message = data;
        } else if (data instanceof Error) {
            result.message = data.message;
            result.stack = trimErrorStack(data, errorStack);
        }   
        if(chain){
            result.chain = chain;
        }

        const workId = this.cls.get('workId');
        await this.manager.logTask(context, Log.Level.ERROR, result, workId);
    }

    // HTTP CONTEXT
    async triggerTask(data: TaskStartRequestDTO): Promise<string> {
        const { domain, task, taskType } = data;
        const taskId = TaskId.convertToTaskId(domain, task, taskType);

        if(this.manager.isValidTask(taskId)){
            throw new NotFoundException(`${taskId} not found`)
        }
        if(this.manager.isRunning(taskId)){
            throw new ConflictException(`${taskId} is already running`)
        }
        if(typeof this[task] === 'function'){
            this[task](taskType);
            return `${taskId} started`
        }else {
            throw new InternalServerErrorException(`Unknown error`);
        }
    }
}