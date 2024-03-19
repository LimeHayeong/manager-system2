import { Controller, Post, UseFilters, UseInterceptors } from '@nestjs/common';

import { ApiResponse } from 'src/manager-sys/types/api.response';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { DomainAFirstService } from './domain.a.first.service';
import { DomainASecondService } from './domain.a.second.service';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('domain.a')
@UseInterceptors(CustomInterceptor)
export class DomainAController {
    constructor(
        private readonly firstService: DomainAFirstService,
        private readonly secondService: DomainASecondService,
    ) {}

    @Post('/service/processRT/start')
    async triggerTask(): Promise<ApiResponse> {
        const result = await this.firstService.triggerTask({ domain: 'domain.a', service: 'service', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }

    @Post('/service/processStore/start')
    async triggerTask2(): Promise<ApiResponse> {
        const result = await this.firstService.triggerTask({ domain: 'domain.a', service: 'service', task: 'processStore'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }

    @Post('/second-service/processRT/start')
    async triggerTask3():Promise<ApiResponse> {
        const result = await this.secondService.triggerTask({ domain: 'domain.a', service: 'second-service', task: 'processRT'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }

    @Post('/second-service/processStore/start')
    async triggerTask4():Promise<ApiResponse> {
        const result = await this.secondService.triggerTask({ domain: 'domain.a', service: 'second-service', task: 'processStore'});
        return {
            code: 200,
            payload: {
                message: null,
                data: result,
            }
        }
    }
}
