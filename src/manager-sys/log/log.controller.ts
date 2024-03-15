import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { LogService } from './log.service';
import { Request, Response } from 'express';
import { FilteringOptions, LogQuerybyContextIdDTO, LogQuerybyTaskIdDTO, LogResponseDTO, RecentLogQueryDTO } from './dto/log-query.dto';
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
        const result: LogResponseDTO = {
            page: Number(logs.page),
            limit: logs.limit,
            totalCount: logs.totalCount,
            logs: logs.logs,
            filteringOptions: FilteringOptions,
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

    @Get('/')
    async getLogs(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQuerybyContextIdDTO | LogQuerybyTaskIdDTO,
    ) {
        const { queryType, ...remains } = query;
        let logs;
        let queryData;
        // console.log('log controller: ', query);
        if(queryType === 'contextId') {
            queryData = remains as LogQuerybyContextIdDTO;
            logs = await this.logService.getLogByContextIds(queryData);
        }else if(queryType === 'taskId') {
            queryData = remains as LogQuerybyTaskIdDTO;
            logs = await this.logService.getLogsByTaskId(queryData);
        }else{
            throw new Error('Invalid query type');
        }
        const result: LogResponseDTO = {
            ...logs,
            filteringOptions: FilteringOptions,
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

    // test
    @Get('/test')
    async getLogsTest(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQuerybyContextIdDTO | LogQuerybyTaskIdDTO,
    ) {
        const { queryType, ...remains } = query;
        let logs;
        let queryData;
        console.log('log controller: ', query);
        if(queryType === 'contextId') {
            queryData = remains as LogQuerybyContextIdDTO;
            logs = await this.logService.getLogByContextIds(queryData);
        }else if(queryType === 'taskId') {
            queryData = remains as LogQuerybyTaskIdDTO;
            logs = await this.logService.getLogsByTaskIdAdvanced(queryData);
        }else{
            throw new Error('Invalid query type');
        }
        const result: LogResponseDTO = {
            ...logs,
            filteringOptions: FilteringOptions,
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
