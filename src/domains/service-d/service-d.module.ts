import { Module } from '@nestjs/common';
import { ServiceDService } from './service-d.service';
import { ServiceDController } from './service-d.controller';

@Module({
  providers: [ServiceDService],
  controllers: [ServiceDController]
})
export class ServiceDModule {}
