import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { LogService } from './log.service';
import { Request, Response } from 'express';
import { LogQuerybyContextIdDTO, LogQuerybyTaskIdDTO, RecentLogQueryDTO } from './dto/log-query.dto';
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
        const logs = await this.logService.getRecentLogs(query);
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
        @Query() query: LogQuerybyContextIdDTO | LogQuerybyTaskIdDTO,
    ) {
        const { queryType, ...remains } = query;
        let result;
        let queryData;
        if(queryType === 'contextId') {
            queryData = remains as LogQuerybyContextIdDTO;
            result = await this.logService.getLogByContextIds(queryData);
        }else if(queryType === 'taskId') {
            queryData = remains as LogQuerybyTaskIdDTO;
            result = await this.logService.getLogsByTaskId(queryData);
        }
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
