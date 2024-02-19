import { Body, Controller, Get, Post, Query, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common';

import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';
import { ServiceBService } from './service-b.service';
import { TaskActivateRequestDTO, TaskStartRequestDTO, TaskStatisticRequestDTO } from '../../manager-sys/common-dto/task-control.dto';
import { ApiResponse } from 'src/manager-sys/types/api.response';
import { Request, Response } from 'express';
import { CustomInterceptor } from 'src/manager-sys/global.interceptor';

@UseFilters(HttpExceptionFilter)
@Controller('serviceB')
@UseInterceptors(CustomInterceptor)
export class ServiceBController {
    constructor(
        private readonly service: ServiceBService
    ) {}

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

    @Get('/statistic')
    async getStatistic(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: TaskStatisticRequestDTO,
    ) {
        const statistic = await this.service.getStatistic(query);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `${query.domain}:${query.task}:${query.taskType} 조회 성공`,
            data: statistic,
        }
        res.status(200).json(response);
    }
}
