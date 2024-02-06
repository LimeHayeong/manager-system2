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

        // TODO: Error handling
        descriptor.value = async function(...args: any[]) {
            // DEFAULT: CRON
            let context = 'CRON';
            if (args.length > 0 && args[0]) {
                context = args[0]; // 첫 번째 인자로 context가 제공되면 해당 값을 사용
            }

            // context에 따라 cls 상태 업데이트
            this.cls.set('context', {domain: this.cls.get('context').domain, method: this.cls.get('context').method, context});

            // managerService.build 호출
            this.managerService.build(this.cls.get('context'));
            // managerService.start 호출
            this.managerService.start(this.cls.get('context'));

            try {
                // 원래 메서드 실행
                const result = await originalMethod.apply(this, args);
                return result;
            } finally {
                // managerService.end 호출
                this.managerService.end(this.cls.get('context'));
            }
        };

        return descriptor;
    }
}