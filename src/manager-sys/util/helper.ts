export namespace Helper {
    export function clsBuilder(domain: string, task: string) {
        return {
            setup: (cls) => {
                cls.set('context', {domain, task});
            }
        }
    }

    // AutoManageDecorator.ts
    // Decorator 단점 - 동기적으로 실행되기 때문에 비동기 불가.
    export function AutoManage(target: any, propertyName: string, descriptor: PropertyDescriptor) {
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
                this.cls.set('context', taskIdentity);

                // managerService.build 호출
                if(await this.managerService.buildTask(this.cls.get('context'))){
                    // build가 성공적으로 시행되면,
                    // managerService.start 호출
                    await this.managerService.startTask(this.cls.get('context'));

                    try {
                        // 원래 메서드 실행
                        const result = await originalMethod.apply(this, args);
                        return result;
                    } finally {
                        // managerService.end 호출
                        await this.managerService.endTask(this.cls.get('context'));
                    }
                }
            } catch (e) {
                console.error(e);
            }
        };

        return descriptor;
    }
}