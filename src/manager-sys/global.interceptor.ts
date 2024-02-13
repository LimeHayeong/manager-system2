import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';

import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

export class CustomInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        // 여기에서 컨텍스트 유형에 따라 적절한 예외 처리를 수행
        if (context.getType() === 'http') {
          // HTTP 컨텍스트 예외 처리
          console.log('HTTP 컨텍스트에서 에러가 발생했습니다.')
        } else if (context.getType() === 'ws') {
          // WebSocket 컨텍스트 예외 처리
          console.log('WebSocket 컨텍스트에서 에러가 발생했습니다.')
        } else {
          // 기타 컨텍스트 예외 처리
          console.log('CRON 컨텍스트에서 에러가 발생했습니다.')
        }
        throw error; // 또는 적절한 예외 변환
      })
    );
  }
}