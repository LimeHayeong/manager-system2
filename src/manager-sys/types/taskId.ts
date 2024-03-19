import { getEnumKeyFromValue, getEnumValueFromKey } from "../util/enum";

import { Task } from "./task";

export namespace TaskId {
    export const TaskIds = [
        {
            domain: 'domain.a',
            service: 'service',
            task: 'processRT',
            exeTypes: ['TRIGGER', 'CRON']
        },
        {
            domain: 'domain.a',
            service: 'service',
            task: 'processStore',
            exeTypes: ['TRIGGER','CRON']
        },
        {
            domain: 'domain.a',
            service: 'second-service',
            task: 'processRT',
            exeTypes: ['TRIGGER', 'CRON']
        },
        {
            domain: 'domain.a',
            service: 'second-service',
            task: 'processStore',
            exeTypes: ['TRIGGER', 'CRON']
        },
        {
            domain: 'domain.b',
            service: 'service',
            task: 'processRT',
            exeTypes: ['TRIGGER', 'CRON']
        },
        {
            domain: 'domain.c',
            service: 'service',
            task: 'processRT',
            exeTypes: ['TRIGGER', 'CRON']
        },
        {
            domain: 'domain.d',
            service: 'service',
            task: 'processRT',
            exeTypes: ['CRON', 'TRIGGER']
        }
    ]

    export interface context {
        taskId: string;
        exeType: string;
    }

    // '001-001-02' 형식의 문자열로 변환하는 함수
    export function convertToTaskId(domain: string, service: string, task: string): string {
        const domainT = domain as keyof typeof Task.Domain
        const serviceT = service as keyof typeof Task.Service
        const taskT = task as keyof typeof Task.Task;

        const domainValue = getEnumValueFromKey(Task.Domain, domainT)
        const serviceValue = getEnumValueFromKey(Task.Service, serviceT)
        const taskValue = getEnumValueFromKey(Task.Task, taskT)

        const domainId = String(domainValue != null ? domainValue : "0").padStart(3, '0');
        const serviceId = String(serviceValue != null ? serviceValue : "0").padStart(3, '0');
        const taskId = String(taskValue != null ? taskValue : "0").padStart(3, '0');

        const result = `${domainId}-${serviceId}-${taskId}`;

        if(result === '000-000-000') return null;
        return result;
    }

    // 문자열 '001-001-02'을 domain, task, taskType으로 변환하는 함수
    export function convertFromTaskId(taskId: string): { domain: string, service: string, task: string } {
        const parts = taskId.split('-').map(part => parseInt(part, 10));
        const domain = getEnumKeyFromValue(Task.Domain, parts[0]);
        const service = getEnumKeyFromValue(Task.Service, parts[1]);
        const task = getEnumKeyFromValue(Task.Task, parts[2]);

        return {
            domain: domain as string,
            service: service as string,
            task: task as string
        };
    }

    export function generateTaskId(): string[] {
        const codes: string[] = [];

        TaskIds.map((id) => {
            const domain = id.domain as keyof typeof Task.Domain;
            const service = id.service as keyof typeof Task.Service;
            const task = id.task as keyof typeof Task.Task;

            const domainId = String(Task.Domain[domain]).padStart(3, '0');
            const serviceId = String(Task.Service[service]).padStart(3, '0');
            const taskId = String(Task.Task[task]).padStart(3, '0');
            const code = `${domainId}-${serviceId}-${taskId}`
            codes.push(code);
        })

        return codes;
    }

    export function generateTaskIdAuto(): string[] {
        const codes: string[] = [];
    
        // Object.keys에서 문자열 키만 필터링
        const domainKeys = Object.keys(Task.Domain).filter(key => isNaN(Number(key)));
        const serviceKeys = Object.keys(Task.Service).filter(key => isNaN(Number(key)));
        const taskKeys = Object.keys(Task.Task).filter(key => isNaN(Number(key)));
    
        for(const domain of domainKeys) {
            for(const service of serviceKeys) {
                for(const task of taskKeys) {
                    // 숫자 값으로 변환하여 사용
                    const domainId = String(Task.Domain[domain]).padStart(3, '0');
                    const serviceId = String(Task.Service[service]).padStart(3, '0');
                    const taskId = String(Task.Task[task]).padStart(3, '0');
                    const code = `${domainId}-${serviceId}-${taskId}`
                    codes.push(code);
                }
            }
        }
    
        return codes;
    }

    export function createRegexFromTaskId(taskId: string): RegExp {
        if(!taskId) return null;
        const parts = taskId.split('-');
        const domain = parts[0];
        const service = parts[1];
        const task = parts[2];

        let pattern = ``;

        if(domain != '000') {
            pattern += `${domain}`
        } else {
            pattern += '.{3}'
        }

        if(service !== '000') {
            pattern += `-${service}`
        } else {
            pattern += '-.{3}'
        }

        if(task !== '000') {
            pattern += `-${task}`
        } else {
            pattern += '-.{3}'
        }

        return new RegExp(`^${pattern}$`)
    }
}