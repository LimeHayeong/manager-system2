import { Controller, Post, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common';

import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';
import { DomainAFirstService } from './domain.a.first.service';
import { DomainASecondService } from './domain.a.second.service';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/manager-sys/types/api.response';

@UseFilters(HttpExceptionFilter)
@Controller('domain/a')
@UseInterceptors(CustomInterceptor)
export class DomainAController {
    constructor(
        private readonly firstService: DomainAFirstService,
        private readonly secondService: DomainASecondService,
    ) {}

    @Post('/firstService/processRT/start')
    async triggerTask(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const result = await this.firstService.triggerTask({ domain: 'DomainA', service: 'FirstService', task: 'processRT'});
        const response: ApiResponse = {
            code: 200,
            payload: {
                message: 'Success',
                data: result,
            }
        }
        res.status(200).send(response);
    }

    @Post('/secondService/processRT/start')
    async triggerTask2(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        const result = await this.secondService.triggerTask({ domain: 'DomainA', service: 'SecondService', task: 'processRT'});
        const response: ApiResponse = {
            code: 200,
            payload: {
                message: 'Success',
                data: result,
            }
        }
        res.status(200).send(response);
    }
}
