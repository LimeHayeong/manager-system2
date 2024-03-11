import { Controller, UseFilters, UseInterceptors } from '@nestjs/common';

import { CustomInterceptor } from 'src/manager-sys/global.interceptor';
import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('ServiceA')
@UseInterceptors(CustomInterceptor)
export class ServiceAController {}
