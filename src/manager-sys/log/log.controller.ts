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

    @Get('/ctxid')
    async getLogsByContextId(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQuerybyContextIdDTO
    ) {
        const logs = await this.logService.getLogByContextIds(query);
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

    @Get('/taskid')
    async getLogsByTaskId(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQuerybyTaskIdDTO,
    ) {
        const logs = await this.logService.getLogsByTaskId(query);
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

    // 병렬처리 테스트용
    @Get('/taskid/test')
    async getLogsByTaskIdConcurrent(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: LogQuerybyTaskIdDTO,
    ) {
        const logs = await this.logService.getLogsByTaskIdAdvanced(query);
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
