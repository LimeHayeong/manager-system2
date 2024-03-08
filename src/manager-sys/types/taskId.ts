import { getEnumKeyFromValue, getEnumValueFromKey } from "../util/enum";

export namespace TaskId {
    export enum DomainEnum {
        ServiceA = 1,
        ServiceB = 2,
        ServiceC = 3,
        ServiceD = 4,
    }
    
    export enum TaskEnum {
        functionA = 1,
        functionB = 2,
        functionC = 3,
        functionD = 4,
    }
    
    export enum TaskTypeEnum {
        CRON = 1,
        TRIGGER = 2,
        WORK = 3,
    }

    // '001-001-02' 형식의 문자열로 변환하는 함수
    export function convertToTaskId(domain: keyof typeof DomainEnum, task: keyof typeof TaskEnum, taskType: keyof typeof TaskTypeEnum): string {
        const domainId = String(getEnumValueFromKey(DomainEnum, domain)).padStart(3, '0');
        const taskId = String(getEnumValueFromKey(TaskEnum, task)).padStart(3, '0');
        const taskTypeId = String(getEnumValueFromKey(TaskTypeEnum, taskType)).padStart(2, '0');

        return `${domainId}-${taskId}-${taskTypeId}`;
    }

    // 문자열 '001-001-02'을 domain, task, taskType으로 변환하는 함수
    export function convertFromTaskId(taskId: string): { domain: string, task: string, taskType: string } {
        const parts = taskId.split('-').map(part => parseInt(part, 10));
        const domain = getEnumKeyFromValue(DomainEnum, parts[0]);
        const task = getEnumKeyFromValue(TaskEnum, parts[1]);
        const taskType = getEnumKeyFromValue(TaskTypeEnum, parts[2]);

        return {
            domain: domain as string,
            task: task as string,
            taskType: taskType as string
        };
    }
}

// 함수 사용 예시
const taskId = TaskId.convertToTaskId('ServiceA', 'functionA', 'TRIGGER'); // '001-001-02'
// 001-001-02

const components = TaskId.convertFromTaskId('001-001-02');
// { domain: 'ServiceA', task: 'processRT', taskType: 'TRIGGER' }
