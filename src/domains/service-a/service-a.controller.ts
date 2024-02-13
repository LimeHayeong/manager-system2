import { Body, Controller, Post, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common';

import { ServiceAService } from './service-a.service';
import { TaskActivateRequestDTO, TaskStartRequestDTO } from '../common-dto/task-control.dto';
import { Request, Response } from 'express';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';
import { ApiResponse } from 'src/manager-sys/types/api.response';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';

@UseFilters(HttpExceptionFilter)
@Controller('serviceA')
@UseInterceptors(CustomInterceptor)
export class ServiceAController {
    constructor(
        private readonly service: ServiceAService) {}

    @Post('/start')
    async triggerTask(
        @Req() req: Request,
        @Res() res: Response,
        @Body() data: TaskStartRequestDTO,
    ) {
        const message = await this.service.triggerTask(data);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: message,
        }
        res.status(200).json(response);
    }

    @Post('/activate')
    async activateTask(
        @Req() req: Request,
        @Res() res: Response,
        @Body() data: TaskActivateRequestDTO,
    ) {
        const message = await this.service.activateTask(data);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: message,
        }
        res.status(200).json(response);
    }
}
