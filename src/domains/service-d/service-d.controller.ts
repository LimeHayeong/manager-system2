import { Body, Controller, Post, Req, Res, UseFilters } from '@nestjs/common';

import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';
import { ServiceDService } from './service-d.service';
import { TaskActivateRequestDTO, TaskStartRequestDTO } from '../../manager-sys/common-dto/task-control.dto';
import { Request, Response } from 'express';
import { ApiResponse } from 'src/manager-sys/types/api.response';

@UseFilters(HttpExceptionFilter)
@Controller('serviceD')
export class ServiceDController {
    constructor(
        private readonly service: ServiceDService
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
}
