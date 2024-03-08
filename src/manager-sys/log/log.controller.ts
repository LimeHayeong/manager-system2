import { Controller } from '@nestjs/common';
import { LogService } from './log.service';

@Controller('log')
export class LogController {
    constructor(
        private readonly service: LogService,
    ) {

    }
}
