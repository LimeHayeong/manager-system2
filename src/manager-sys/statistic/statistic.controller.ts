import { Controller, Get, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { ApiResponse } from '../types/api.response';
import { StatisticService } from './statistic.service';
import { ViExeRequestDTO } from './dto/vi.dto';

@Controller('statistic')
export class StatisticController {
    constructor(
        private readonly service: StatisticService,
    ) {
    }

    // @Get('/exe')
    // async getExeStatistic(
    //     @Req() req: Request,
    //     @Res() res: Response,
    //     @Query() query: ViExeRequestDTO
    // ) {
    //     const { domain, task, taskType, pointNumber, pointSize } = query;
    //     const data = await this.service.getExeStatistic(domain, task, taskType, pointNumber, pointSize);
    //     const response: ApiResponse = {
    //         code: 200,
    //         payload: {
    //             message: null,
    //             data: data
    //         }
    //     }
    //     res.status(200).json(response);
    // }
}
