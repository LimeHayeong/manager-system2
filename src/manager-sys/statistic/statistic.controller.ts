import { Controller, Get, Query } from '@nestjs/common';

import { ApiResponse } from '../types/api.response';
import { StatisticService } from './statistic.service';
import { ViExeRequestbyTaskIdDTO, ViExeResponsebyTaskIdDTO, ViTimeRequestbyTaskIdDTO, ViTimeResponsebyTaskIdDTO } from './dto/vi.dto';

@Controller('stat')
export class StatisticController {
    constructor(
        private readonly service: StatisticService,
    ) {
    }

    @Get('/exe/taskid')
    async getExeStatisticByTaskId(
        @Query() query: ViExeRequestbyTaskIdDTO
    ): Promise<ApiResponse> {
        const data: ViExeResponsebyTaskIdDTO = await this.service.getExeStatisticByTaskId(query);
        return {
            code: 200,
            payload: {
                message: null,
                data: data
            }
        }
    }

    @Get('/time/taskid')
    async getTimeStatisticByTaskId(
        @Query() query: ViTimeRequestbyTaskIdDTO
    ): Promise<ApiResponse> {
        const data: ViTimeResponsebyTaskIdDTO = await this.service.getTimeStatisticByTaskId(query);
        return {
            code: 200,
            payload: {
                message: null,
                data: data
            }
        }
    }
}
