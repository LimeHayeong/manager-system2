import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiResponse } from '../types/api.response';
import { StatisticService } from './statistic.service';
import { ViExeRequestbyTaskIdDTO, ViExeResultbyTaskIdDTO, ViTimeRequestbyTaskIdDTO, ViTimeResultbyTaskIdDTO } from './dto/vi.dto';

@Controller('statistic')
export class StatisticController {
    constructor(
        private readonly service: StatisticService,
    ) {
    }

    @Get('/exe')
    async getExeStatistic(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: ViExeRequestbyTaskIdDTO
    ) {
        const data: ViExeResultbyTaskIdDTO = await this.service.getExeStatistic(query);
        const response: ApiResponse = {
            code: 200,
            payload: {
                message: null,
                data: data
            }
        }
        res.status(200).json(response);
    }

    @Get('/time')
    async getTimeStatistic(
        @Req() req: Request,
        @Res() res: Response,
        @Query() query: ViTimeRequestbyTaskIdDTO
    ) {
        const data: ViTimeResultbyTaskIdDTO = await this.service.getTimeStatistic(query);
        const response: ApiResponse = {
            code: 200,
            payload: {
                message: null,
                data: data
            }
        }
        res.status(200).json(response);
    }
}
