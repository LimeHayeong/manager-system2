import { delay } from "./delay";
import { v4 as uuid } from 'uuid';

export namespace Helper {
    export function clsWorkBuilder() {
        return {
            setup: (cls) => {
                cls.set('workId', uuid())
            }
        }
    }

    export function clsBuilder(domain: string, task: string) {
        return {
            setup: (cls) => {
                cls.set('context', {domain, task});
            }
        }
    }

    export function AutoWorkManage(target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args: any[]) {
            try {
                const data = args[0];
                if(await this.managerService.buildWork(data)){
                    // 성공적으로 building에 성공하면,
                    await this.managerService.startWork(data, this.cls.get('workId'))
                    try {
                        // 원래 메서드 실행
                        const result = await originalMethod.apply(this, args);
                        return result;
                    } finally {
                        // managerService.end 호출
                        await this.managerService.endWork(data);
                    }
                }
            } catch (e) {
                console.log('task helper catch: ' + e.stack);
                throw e;
            }
        }

        return descriptor;
    }

    // AutoManageDecorator.ts
    export function AutoTaskManage(target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function(...args: any[]) {
            try {
                // DEFAULT: CRON
                let context = 'CRON';
                if (args.length > 0 && args[0]) {
                    context = args[0]; // 첫 번째 인자로 context가 제공되면 해당 값을 사용
                }

                // context에 따라 cls 상태 업데이트
                const taskIdentity = {
                    domain: this.cls.get('context').domain,
                    task: this.cls.get('context').task,
                    taskType: context
                };
                this.cls.set('context', taskIdentity)

                // managerService.build 호출
                if(await this.managerService.buildTask(this.cls.get('context'))){
                    // build가 성공적으로 시행되면,
                    // managerService.start 호출

                    // workId가 있다면 workContext임.
                    if(this.cls.get('workId')){
                        await this.managerService.startTask(this.cls.get('context'), this.cls.get('workId'));
                    }else{
                        await this.managerService.startTask(this.cls.get('context'));
                    }
                    
                    try {
                        // 원래 메서드 실행
                        const result = await originalMethod.apply(this, args);
                        return result;
                    } finally {
                        // managerService.end 호출
                        if(this.cls.get('workId')){
                            await this.managerService.endTask(this.cls.get('context'), this.cls.get('workId'));
                        } else {
                            await this.managerService.endTask(this.cls.get('context'));
                        }
                    }
                }
            } catch (e) {
                console.log('task helper catch: ' + e.stack);
                throw e;
            }
        };

        return descriptor;
    }

    export function ExecutionTimerAsync(target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = async function(...args: any[]) {
            console.time(propertyName);
            try {
                const result = await originalMethod.apply(this, args);
                return result;
            } catch(e) {
                console.error('task helper catch: ' + e.stack);
                throw e;
            } finally {
                console.timeEnd(propertyName)
            }
        }
        return descriptor;
    }

    export function ExecutionTimerSync(target: any, propertyName: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function(...args: any[]) {
            console.time(propertyName);
            try {
                const result = originalMethod.apply(this, args);
                return result;
            } catch(e) {
                console.error('task helper catch: ' + e.stack);
                throw e;
            } finally {
                console.timeEnd(propertyName);
            }
        }
        return descriptor;
    }

    // export function LogError(target: any, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) {
    //     const method = descriptor.value; // 원래의 메서드
    
    //     descriptor.value = function (...args: any[]) {
    //         try {
    //             const result = method.apply(this, args);

    //             // 반환값이 Promise인 경우 (비동기 함수)
    //             if (result instanceof Promise) {
    //                 return result.then(data => data).catch(error => {
    //                     console.log(`[Async] Error in ${propertyName} with arguments: ${JSON.stringify(args)}`);
    //                     throw error;
    //                 });
    //             }

    //             // 동기 함수인 경우
    //             return result;
    //         } catch (error) {
    //             // Error.captureStackTrace(error, this.constructor);
    //             // console.log(error.stack);
    //             console.log(`[Sync] Error in ${propertyName} with arguments: ${JSON.stringify(args)}`);
    //             throw error;
    //         }
    //     };
    // }
}