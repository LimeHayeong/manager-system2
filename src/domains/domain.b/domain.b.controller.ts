import { Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';

import { ApiResponse } from 'src/manager-sys/types/api.response';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { DomainBFirstService } from './domain.b.first.service';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('domain.b')
@UseInterceptors(CustomInterceptor)
export class DomainBController {
    constructor(
        private readonly firstService: DomainBFirstService
    ){}

    @Post('/service/processRT/start')
    async triggerTask(): Promise<ApiResponse> {
        const result = await this.firstService.triggerTask({ domain: 'domain.b', service: 'service', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }
}
