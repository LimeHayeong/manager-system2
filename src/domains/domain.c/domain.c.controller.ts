import { Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';

import { ApiResponse } from 'src/manager-sys/types/api.response';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { DomainCFirstService } from './domain.c.first.service';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('domain.c')
@UseInterceptors(CustomInterceptor)
export class DomainCController {
    constructor(
        private readonly firstService: DomainCFirstService
    ) {}

    @Post('/service/processRT/start')
    async triggerTask(): Promise<ApiResponse> {
        const result = await this.firstService.triggerTask({ domain: 'domain.c', service: 'service', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }
}
