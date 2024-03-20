import { Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';

import { ApiResponse } from 'src/manager-sys/types/api.response';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { DomainDFirstService } from './domain.first.service';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('domain.d')
@UseInterceptors(CustomInterceptor)
export class DomainDController {
    constructor(
        private readonly firstService: DomainDFirstService,
    ) {}

    @Post('/service/processRT/start')
    async triggerTask(): Promise<ApiResponse> {
        const result = await this.firstService.triggerTask({ domain: 'domain.d', service: 'service', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }
}
