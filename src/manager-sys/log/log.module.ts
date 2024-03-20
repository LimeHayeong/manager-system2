import { DatabaseModule } from '../database/database.module';
import { LogCache } from './log.cache';
import { LogController } from './log.controller';
import { LogService } from './log.service';
import { Module } from '@nestjs/common';
import { logProviders } from './log.providers';

@Module({
  imports: [DatabaseModule],
  providers: [LogService, LogCache,
  ...logProviders],
  exports: [LogCache],
  controllers: [LogController]
})
export class LogModule {}
