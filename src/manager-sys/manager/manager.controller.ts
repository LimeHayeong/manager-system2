import { Controller, Get, Query, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common';
import { HttpExceptionFilter } from '../http.exception.filter';
import { CustomInterceptor } from '../global.interceptor';
import { ManagerService } from './manager.service';
import { ManagerStatistic } from './manager.statistic';
import { Request, Response } from 'express';
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';
import { ApiResponse } from '../types/api.response';

@UseFilters(HttpExceptionFilter)
@Controller('manager')
@UseInterceptors(CustomInterceptor)
export class ManagerController {
    constructor(
        private readonly manager: ManagerService,
        private readonly statistic: ManagerStatistic,
    ) {}

    @Get('/histogram')
    async getHistogram(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: TaskStatisticRequestDTO,
    ) {
        const statistic = await this.statistic.getTaskStatistic(query);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `${query.domain}:${query.task}:${query.taskType} 조회 성공`,
            data: statistic,
        }
        res.status(200).json(response);
    }
}
