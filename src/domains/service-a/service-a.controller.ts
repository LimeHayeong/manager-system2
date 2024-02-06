import { Controller, Get, Req, Res } from '@nestjs/common';

import { ServiceAService } from './service-a.service';
import { ApiError, ApiResponse } from 'src/manager-sys/types/api.response';

@Controller('service-a')
export class ServiceAController {
    constructor(private readonly serviceAService: ServiceAService) {}

    // TODO: 이 부분 build, start시 오류를 어떻게 잘 전달할까 고민해보자.
    @Get('/start')
    triggerProcessRT(
        @Req() req,
        @Res() res
    ) {
        let response: ApiResponse | ApiError;
        try {
            this.serviceAService.processRT('TRIGGER');
            
            response = {
                success: true,
                statusCode: 200,
                message: `Task 시작에 성공했습니다.`
            };
        } catch (e) {
            response = {
                success: false,
                statusCode: 500,
                message: `Task 시작에 실패했습니다.`
            };
        }
        res.status(response.statusCode).json(response);
    }
}
