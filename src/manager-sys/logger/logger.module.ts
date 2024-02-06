import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';
import { Module } from '@nestjs/common';

@Module({
  providers: [LoggerService],
  controllers: [LoggerController],
  exports: [LoggerService],
})
export class LoggerModule {}
