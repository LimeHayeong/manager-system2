import { Task } from "./task";

export class StateFactory {
    static createTaskState(taskId: Task.ITaskIdentity): Task.TaskStatewithLogs {
        return {
            domain: taskId.domain,
            task: taskId.task,
            taskType: taskId.taskType,
            status: taskId.taskType === Task.TaskType.CRON ? Task.TaskStatus.WAITING : Task.TaskStatus.TERMINATED,
            contextId: null,
            isAvailable: true,
            updatedAt: null,
            startAt: null,
            endAt: null,
            recentLogs: [[]]
        }
    }

    static createTaskStatisticState(taskId: Task.ITaskIdentity): Task.TaskStatisticState {
        return {
            domain: taskId.domain,
            task: taskId.task,
            taskType: taskId.taskType,
            contextId: null,
            data: {
                logCount: 0,
                infoCount: 0,
                warnCount: 0,
                errorCount: 0
            },
            recentStatistics: []
        }
    }
    
    static createWorkState(workId: Task.IWorkIdentitywithTaskList): Task.WorkState {
        return {
            work: workId.work,
            workType: workId.workType,
            status: Task.TaskStatus.TERMINATED,
            contextId: null,
            updatedAt: null,
            startAt: null,
            endAt: null,
            taskList: workId.taskList
        }
    }

    static createGrid(taskIds: Task.ITaskIdentity[], length: number): Task.GRID[] {
        return taskIds.map(taskId => ({
                ...taskId,
                grid: Array.from({ length: length }, () => ({
                    logCount: 0,
                    infoCount: 0,
                    warnCount: 0,
                    errorCount: 0
                }))
        }))
    }
}

export const TaskIdentity: Task.ITaskIdentity[] = [
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
    },
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
    },
    {
        domain: 'ServiceA',
        task: 'processRT',
        taskType: Task.TaskType.WORK,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.CRON,
    },
    {
        domain: 'ServiceB',
        task: 'processRT',
        taskType: Task.TaskType.WORK,
    },
    {
        domain: 'ServiceC',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
    },
    {
        domain: 'ServiceC',
        task: 'processHelper',
        taskType: Task.TaskType.TRIGGER,
    },
    {
        domain: 'ServiceD',
        task: 'processRT',
        taskType: Task.TaskType.TRIGGER,
    },
    {
        domain: 'ServiceD',
        task: 'processRT',
        taskType: Task.TaskType.WORK,
    }
]

export const WorkIdentity: Task.IWorkIdentitywithTaskList[] = [
    {
        work: 'sampleWork',
        workType: Task.TaskType.TRIGGER,
        taskList: [
            {
                domain: 'ServiceA',
                task: 'processRT',
                taskType: Task.TaskType.WORK,
            },
            {
                domain: 'ServiceB',
                task: 'processRT',
                taskType: Task.TaskType.WORK,
            },
            {
                domain: 'ServiceD',
                task: 'processRT',
                taskType: Task.TaskType.WORK,
            } 
        ]
    }
]