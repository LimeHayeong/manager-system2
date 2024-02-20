import { Body, Controller, Post, Req, Res, UseFilters, UseInterceptors } from '@nestjs/common';

import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';
import { SampleWorkService } from './sample-work.service';
import { WorkStartRequestDTO } from 'src/manager-sys/common-dto/work-control.dto';
import { ApiResponse } from 'src/manager-sys/types/api.response';
import { Request, Response } from 'express';

@UseFilters(HttpExceptionFilter)
@Controller('sampleWork')
@UseInterceptors(CustomInterceptor)
export class SampleWorkController {
    constructor(
        private readonly service: SampleWorkService,
    ) {}

    @Post('/start')
    async triggerWork(
        @Req() req: Request,
        @Res() res: Response,
        @Body() data: WorkStartRequestDTO,
    ) {
        await this.service.triggerWork(data);
        const response: ApiResponse = {
            success: true,
            statusCode: 200,
            message: 'Work 시작 성공',
        }
        res.status(200).json(response);
    }
}
