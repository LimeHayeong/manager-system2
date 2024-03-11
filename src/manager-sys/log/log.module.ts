import { DatabaseModule } from '../database/database.module';
import { LogController } from './log.controller';
import { LogGateway } from './log.gateway';
import { LogService } from './log.service';
import { Module } from '@nestjs/common';
import { logProviders } from './log.providers';

@Module({
  imports: [DatabaseModule],
  providers: [LogService, LogGateway,
  ...logProviders],
  exports: [LogService],
  controllers: [LogController]
})
export class LogModule {}
