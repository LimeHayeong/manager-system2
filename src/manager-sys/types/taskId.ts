import { getEnumKeyFromValue, getEnumValueFromKey } from "../util/enum";

export namespace TaskId {
    export enum DomainEnum {
        ServiceA = 1,
        ServiceB,
        ServiceC,
        ServiceD,
    }
    
    export enum TaskEnum {
        processRT = 1,
    }
    
    export enum TaskTypeEnum {
        CRON = 1,
        TRIGGER,
        WORK
    }

    // '001-001-02' 형식의 문자열로 변환하는 함수
    export function convertToTaskId(domain: string, task: string, taskType: string): string {
        const domainT = domain as keyof typeof DomainEnum;
        const taskT = task as keyof typeof TaskEnum;
        const taskTypeT = taskType as keyof typeof TaskTypeEnum;
        const domainId = String(getEnumValueFromKey(DomainEnum, domainT)).padStart(3, '0');
        const taskId = String(getEnumValueFromKey(TaskEnum, taskT)).padStart(3, '0');
        const taskTypeId = String(getEnumValueFromKey(TaskTypeEnum, taskTypeT)).padStart(2, '0');

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

    export function generateTaskId(): string[] {
        const codes: string[] = [];
    
        // Object.keys에서 문자열 키만 필터링
        const domainKeys = Object.keys(DomainEnum).filter(key => isNaN(Number(key)));
        const taskKeys = Object.keys(TaskEnum).filter(key => isNaN(Number(key)));
        const taskTypeKeys = Object.keys(TaskTypeEnum).filter(key => isNaN(Number(key)));
    
        for(const domain of domainKeys) {
            for(const task of taskKeys) {
                for(const taskType of taskTypeKeys) {
                    // 숫자 값으로 변환하여 사용
                    const domainId = String(DomainEnum[domain]).padStart(3, '0');
                    const taskId = String(TaskEnum[task]).padStart(3, '0');
                    const taskTypeId = String(TaskTypeEnum[taskType]).padStart(2, '0');
                    const code = `${domainId}-${taskId}-${taskTypeId}`
                    codes.push(code);
                }
            }
        }
    
        return codes;
    }
}