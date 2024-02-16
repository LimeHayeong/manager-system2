import { Injectable } from "@nestjs/common";
import { LoggerService } from "../logger/logger.service";
import { Task } from "../types/task";

const newTaskStatistic: Task.StatisticLog[] = [
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceC',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceC',
        task: 'processHelper',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
    {
        domain: 'ServiceD',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
        executionTime: null,
        data: null,
        timestamp: null,
    },
]

// Q. taskIdx 찾는 과정이 manager랑 같이 있음. 이게 맞을까?
// 인덱스를 아예 동기화시키면 그럴 필요 없기는 함. 일단은 성능에 큰 문제를 주지는 않을 것.
@Injectable()
export class ManagerStatistic {
    private taskStatistic: Task.StatisticLog[] = [];

    constructor(
        private readonly logger: LoggerService,
    ) {
        this.initialization();
    }

    private initialization() {
        newTaskStatistic.forEach(newTaskStatistic => this.taskStatistic.push(newTaskStatistic));
    }

    public async startTask(taskId: Task.ITaskIdentity){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            // 시작할 때 데이터 초기화.
            const currentTaskStatistic = this.taskStatistic[taskIdx]
            currentTaskStatistic.data = this.createNewStatisticData();
            currentTaskStatistic.timestamp = null;
            currentTaskStatistic.executionTime = null;
            currentTaskStatistic.data.logCount++;
            currentTaskStatistic.data.infoCount++;
        }
    }

    public async taskLogCountIncrease(taskId: Task.ITaskIdentity, logType: Task.LogLevel){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            const currentTaskStatistic = this.taskStatistic[taskIdx]
            currentTaskStatistic.data.logCount++;
            if(logType === Task.LogLevel.INFO){
                currentTaskStatistic.data.infoCount++;
            } else if(logType === Task.LogLevel.WARN){
                currentTaskStatistic.data.warnCount++;
            } else if(logType === Task.LogLevel.ERROR){
                currentTaskStatistic.data.errorCount++;
            }
        }
    }

    public async endTask(taskId: Task.ITaskIdentity, startAt: number, endAt: number){
        const taskIdx = this.findTask(taskId);
        if(taskIdx !== -1){
            const currentTaskStatistic = this.taskStatistic[taskIdx]
            currentTaskStatistic.timestamp = Date.now();
            currentTaskStatistic.executionTime = endAt - startAt;
            currentTaskStatistic.data.logCount++;
            currentTaskStatistic.data.infoCount++;
            await this.logger.pushStatisticLog(currentTaskStatistic)
        }
    }

    private findTask(taskId: Task.ITaskIdentity): number{
        const idx = this.taskStatistic.findIndex(task => task.domain === taskId.domain && task.task === taskId.task && task.taskType === taskId.taskType);
        return idx;
    }

    private createNewStatisticData(): Task.taskStatistic {
        return {
            logCount: 0,
            infoCount: 0,
            warnCount: 0,
            errorCount: 0,
        };
    }
}