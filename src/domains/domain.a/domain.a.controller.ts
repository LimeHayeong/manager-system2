import { Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';

import { ApiResponse } from 'src/manager-sys/types/api.response';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { DomainAFirstService } from './domain.a.first.service';
import { DomainASecondService } from './domain.a.second.service';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('domain/a')
@UseInterceptors(CustomInterceptor)
export class DomainAController {
    constructor(
        private readonly firstService: DomainAFirstService,
        private readonly secondService: DomainASecondService,
    ) {}

    @Post('/firstService/processRT/start')
    async triggerTask(): Promise<ApiResponse> {
        const result = await this.firstService.triggerTask({ domain: 'DomainA', service: 'FirstService', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }

    @Post('/secondService/processRT/start')
    async triggerTask2():Promise<ApiResponse> {
        const result = await this.secondService.triggerTask({ domain: 'DomainA', service: 'SecondService', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }
}
