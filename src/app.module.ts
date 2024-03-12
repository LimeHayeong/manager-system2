import * as YAML from 'yaml'
import * as fs from 'fs'
import * as path from 'path'
import * as swaggerUi from 'swagger-ui-express'

import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppService } from './app.service';
import { LogModule } from './manager-sys/log/log.module';
import { ManagerModule } from './manager-sys/manager/manager.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ServiceAModule } from './domains/service-a/service-a.module';
import { ServiceBModule } from './domains/service-b/service-b.module';
import { ServiceCModule } from './domains/service-c/service-c.module';
import { ServiceDModule } from './domains/service-d/service-d.module';
import { StatisticModule } from './manager-sys/statistic/statistic.module';
import { WsPullModule } from './ws/pull/ws.pull.module';

const YAML_PATH = path.resolve(__dirname, '../api.swagger.yaml')
const apiDocument = YAML.parse(fs.readFileSync(YAML_PATH, 'utf8'))

@Module({
  imports: [
    /* Global Modules */
    /* System Modules */
    WsPullModule,
    ManagerModule,
    LogModule,
    StatisticModule,

    ScheduleModule.forRoot(),

    /* Domain Modules */
    
    ServiceAModule,
    ServiceBModule,
    ServiceCModule,
    ServiceDModule
  ],
  controllers: [],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(swaggerUi.serve, swaggerUi.setup(apiDocument))
      .forRoutes('api-docs/')
  }
}
