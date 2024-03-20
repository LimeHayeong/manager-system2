import { Controller, Get, Query, UseFilters, UseInterceptors } from '@nestjs/common';
import { LogService } from './log.service';
import { FilteringOptions, LogQuerybyContextIdDTO, LogQuerybyTaskIdDTO, LogResponseDTO, RecentLogQueryDTO } from './dto/log-query.dto';
import { ApiResponse } from '../types/api.response';
import { HttpExceptionFilter } from '../http.exception.filter';
import { CustomInterceptor } from '../global.interceptor';

@UseFilters(HttpExceptionFilter)
@Controller('log')
@UseInterceptors(CustomInterceptor)
export class LogController {
    constructor(
        private readonly logService: LogService,
    ) {
    }

    @Get('/recent')
    async getRecentLogs(
        @Query() query: RecentLogQueryDTO,
    ): Promise<ApiResponse> {
        const logs = await this.logService.getRecentLogs(query);
        const result: LogResponseDTO = {
            page: Number(logs.page),
            limit: Number(logs.limit),
            totalCount: Number(logs.totalCount),
            logs: logs.logs,
            filteringOptions: FilteringOptions,
        }
        return {
            code: 200,
            payload: {
                message: null,
                data: result
            }
        }
    }

    @Get('/ctxid')
    async getLogsByContextId(
        @Query() query: LogQuerybyContextIdDTO
    ): Promise<ApiResponse> {
        const logs = await this.logService.getLogByContextIds(query);
        const result: LogResponseDTO = {
            ...logs,
            filteringOptions: FilteringOptions,
        }
        return {
            code: 200,
            payload: {
                message: null,
                data: result
            }
        }
    }

    @Get('/taskid')
    async getLogsByTaskId(
        @Query() query: LogQuerybyTaskIdDTO,
    ): Promise<ApiResponse> {
        const logs = await this.logService.getLogsByTaskId(query);
        const result: LogResponseDTO = {
            ...logs,
            filteringOptions: FilteringOptions,
        }
        return {
            code: 200,
            payload: {
                message: null,
                data: result
            }
        }
        
    }

    // 병렬처리 테스트용
    @Get('/taskid/test')
    async getLogsByTaskIdConcurrent(
        @Query() query: LogQuerybyTaskIdDTO,
    ): Promise<ApiResponse> {
        const logs = await this.logService.getLogsByTaskIdAdvanced(query);
        const result: LogResponseDTO = {
            ...logs,
            filteringOptions: FilteringOptions,
        }
       return {
            code: 200,
            payload: {
                message: null,
                data: result
            }
        }
    }
}
