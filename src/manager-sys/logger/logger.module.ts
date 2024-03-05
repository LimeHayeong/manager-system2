import { FileModule } from '../file/file.module';
import { LoggerController } from './logger.controller';
import { LoggerService } from './logger.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [FileModule],
  providers: [LoggerService],
  controllers: [LoggerController],
  exports: [LoggerService],
})
export class LoggerModule {}