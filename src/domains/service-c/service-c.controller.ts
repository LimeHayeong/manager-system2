import { Body, Controller, Get, Post, Query, Req, Res, UseFilters } from '@nestjs/common';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';
import { ServiceCService } from './service-c.service';
import { ServiceCHelper } from './service-c.helper';
import { TaskActivateRequestDTO, TaskStartRequestDTO, TaskStatisticRequestDTO } from '../../manager-sys/common-dto/task-control.dto';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/manager-sys/types/api.response';

@UseFilters(HttpExceptionFilter)
@Controller('serviceC')
export class ServiceCController {
    constructor(
        private readonly service: ServiceCService,
        private readonly serviceCHelper: ServiceCHelper,
    ) {}

    @Post('/start')
    async triggerTask(
        @Req() req: Request,
        @Res() res: Response,
        @Body() data: TaskStartRequestDTO,
    ) {
        let message;
        if(data.task === 'processRT') {
            message = await this.service.triggerTask(data);
        }else if(data.task === 'processHelper') {
            message = await this.serviceCHelper.triggerTask(data);
        }
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
        let message;
        if(data.task === 'processRT') {
            message = await this.service.activateTask(data);
        }else if(data.task === 'processHelper') {
            message = await this.serviceCHelper.activateTask(data);
        }
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
