import * as YAML from 'yaml'
import * as fs from 'fs'
import * as path from 'path'
import * as swaggerUi from 'swagger-ui-express'

import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config'
import { DomainAModule } from './domains/domain.a/domain.a.module';
import { DomainBModule } from './domains/domain.b/domain.b.module';
import { DomainCModule } from './domains/domain.c/domain.c.module';
import { DomainDModule } from './domains/domain.d/domain.module';
import { LogModule } from './manager-sys/log/log.module';
import { ManagerModule } from './manager-sys/manager/manager.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StatisticModule } from './manager-sys/statistic/statistic.module';
import { WsPullModule } from './ws/pull/ws.pull.module';

const YAML_PATH = path.resolve(__dirname, '../api.swagger.yaml')
const apiDocument = YAML.parse(fs.readFileSync(YAML_PATH, 'utf8'))

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    }),
    /* Global Modules */
    /* System Modules */
    WsPullModule,
    ManagerModule,
    LogModule,
    StatisticModule,

    ScheduleModule.forRoot(),

    /* Domain Modules */
    
    DomainAModule,
    DomainBModule,
    DomainCModule,
    DomainDModule
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
