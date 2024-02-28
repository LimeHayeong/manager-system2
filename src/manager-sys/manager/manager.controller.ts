import { Controller, Get, Query, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common';
import { HttpExceptionFilter } from '../http.exception.filter';
import { CustomInterceptor } from '../global.interceptor';
import { ManagerService } from './manager.service';
import { ManagerStatistic } from './manager.statistic';
import { Request, Response } from 'express';
import { TaskStatisticRequestDTO } from '../common-dto/task-control.dto';
import { ApiResponse } from '../types/api.response';
import { GridRequestDTO, LogQueryDTO } from './dto/task-statistic.dto';

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
        const statistic = this.statistic.getTaskStatistic(query);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `${query.domain}:${query.task}:${query.taskType} 조회 성공`,
            data: statistic,
        }
        res.status(200).json(response);
    }

    @Get('/linechart')
    getAll(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // const result = this.statistic.getAllStatistic(Task.TaskType.CRON);
        const result = this.statistic.getAllStatistic();
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `모니터링 전체 데이터 조회 성공`,
            data: result,
        }
        res.status(200).json(response);
    }

    @Get('/grid')
    async getGrid(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: GridRequestDTO,
    ) {
        const result = await this.statistic.getGrid(query);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `그리드 전체 데이터 조회 성공`,
            data: result,
        }
        res.status(200).json(response);
    }

    @Get('/logs')
    async getLogs(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQueryDTO,
    ) {
        const result = await this.statistic.queryLog(query);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `로그 쿼리 성공`,
            data: result,
        }
        res.status(200).json(response);
    }

    // for test
    @Get('/test')
    getState(
        @Req() req: Request,
        @Res() res: Response,
    ){
        const result = this.statistic.getAllStatistic();
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: `모니터링 전체 데이터 조회 성공`,
            data: result,
        }
        res.status(200).json(response);
    }
}
