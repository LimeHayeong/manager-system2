import { Controller, UseFilters } from '@nestjs/common';

import { HttpExceptionFilter } from 'src/manager-sys/http.exception.filter';

@UseFilters(HttpExceptionFilter)
@Controller('serviceB')
export class ServiceBController {}
