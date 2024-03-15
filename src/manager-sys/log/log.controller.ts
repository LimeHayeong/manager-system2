import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { LogService } from './log.service';
import { Request, Response } from 'express';
import { LogQueryDTO, RecentLogQueryDTO } from './dto/log-query.dto';
import { TaskId } from '../types/taskId';
import { ApiResponse } from '../types/api.response';

@Controller('log')
export class LogController {
    constructor(
        private readonly logService: LogService,
    ) {
    }

    @Get('/recent')
    async getRecentLogs(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: RecentLogQueryDTO,
    ) {
        const { domain, service, task, exeType, number = 3 } = query;
        const logs = await this.logService.getRecentLogs(domain, service, task, exeType, number);
        const response: ApiResponse = {
            code: 200,
            payload: {
                message: null,
                data: logs
            }
        }
        res.status(200).json(response);
    }

    @Get('/')
    async getLogs(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQueryDTO,
    ) {
        const result = await this.logService.getLogs(query);
        const response: ApiResponse = {
            code: 200,
            payload: {
                message: null,
                data: result
            }
        }
        res.status(200).json(response);
    }
}
