import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AutoManageInterceptor implements NestInterceptor {
  constructor(private readonly managerService: ManagerService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const cls = this.getCls(context); // cls 상태를 가져오는 가상의 메서드, 구현 필요
    const taskIdentity = {
      domain: cls.get('context').domain,
      task: cls.get('context').task,
      taskType: 'CRON', // 예시로 'CRON'을 직접 사용
    };
    cls.set('context', taskIdentity);

    if (await this.managerService.buildTask(cls.get('context'))) {
      await this.managerService.startTask(cls.get('context'));

      return next.handle().pipe(
        tap(async () => {
          await this.managerService.endTask(cls.get('context'));
        }),
      );
    }

    throw new Error('Task build failed');
  }

  private getCls(context: ExecutionContext): any {
    // ExecutionContext를 사용하여 cls 상태를 얻는 로직 구현
  }
}
